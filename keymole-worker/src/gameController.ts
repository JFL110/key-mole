import { DurableObject } from "cloudflare:workers";
import { WebsocketController } from "./websocketController";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const WHACKS_PER_ROUND = 10
const ROUNDS_PER_GAME = 4
const MOLE_MISSPRESS_PENALTY = 250
const WHACKER_MISPRESS_PENALTY = 250
const WHACKER_PRESS_BONUS = 250
const PLAYER_RECONNECT_MS = 2000
const KEYS_COUNT = 15

export class GameController extends DurableObject<Env> {
    websocketController: WebsocketController
    gameState: GameState

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.websocketController = new WebsocketController({
            onOpen: (id) => this.onOpen(id),
            onMessage: (id, message) => this.onMessage(id, message),
            onClose: (id) => this.onClose(id),
        })
        this.gameState = {
            id: '',
            status: 'not_started',
            players: [],
            keys: [],
            moleKeys: [],
            round: 0,
            whacksInRound: 0,
            winnerId: null
        }
    }

    private onOpen(id: string) {
        if (!this.gameState.players.some(p => p.id === id)) {
            this.gameState.players.push({
                id,
                name: null,
                ready: false,
                moleMispresses: 0,
                whackerMispresses: 0,
                moleDelta: 0,
                whackerPresses: 0,
                status: 'active',
                newGameId: null
            })
        }
    }

    private onClose(id: string) {
        const player = this.gameState.players.find(p => p.id === id)
        if (!player) {
            return
        }
        player.status = 'disconnecting'
        this.sendPublicGameState()

        delay(PLAYER_RECONNECT_MS).then(() => {
            if (player.status !== 'active' && this.gameState.status !== 'ended') {
                this.gameState.players = this.gameState.players.filter(p => p.id !== id)
                this.websocketController.sendToAll({
                    type: 'toast',
                    message: `Player ${id} disconnected`
                })
                this.sendPublicGameState()
            }
        })
    }

    async fetch(request: Request): Promise<Response> {

        const url = new URL(request.url)
        const providedPlayerId = url.searchParams.get('playerId')
        this.gameState.id = url.searchParams.get('gameId')!
        const playerId = providedPlayerId && providedPlayerId !== 'null' ? providedPlayerId : crypto.randomUUID().substring(0, 8)
        const existingPlayer = this.gameState.players.find(p => p.id === playerId)
        if (!existingPlayer && this.gameState.status !== 'not_started') {
            return new Response(null, {
                status: 400,
                statusText: 'Game already in progress',
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
        return this.websocketController.open(playerId)
    }

    private onMessage(id: string, message: GameMessage) {
        console.log('msg', message)
        const player = this.gameState.players.find(p => p.id === id)
        if (!player) {
            console.warn(`Unknown player ${id}`)
            return
        }
        player.lastMessage = Date.now()

        if (message.type === 'init') {
            this.onPlayerInit(player)
        } else if (message.type === 'press_key') {
            this.onPressKey(player, message)
        } else if (message.type === 'ready') {
            this.onPlayerReady(player)
        } else if (message.type === 'new_game_link') {
            this.onNewGameLink(player, message)
        } else if (message.type === 'set_player_name') {
            this.onSetPlayerName(player, message)
        } else {
            console.warn(`Unknown message type ${message.type}`)
        }
        this.sendPublicGameState()
        return
    }

    private onPlayerInit(player: GamePlayer) {
        console.log('on player init')
        player.status = 'active'
        this.websocketController.sendTo(player.id, {
            type: 'set_self_id',
            selfId: player.id
        })
    }

    private onNewGameLink(player: GamePlayer, message: GameMessageNewGameLink) {
        player.newGameId = message.gameId
        this.websocketController.sendToAll({
            type: 'toast',
            message: `${player.name || player.id} started a new game.`
        })
    }

    private onSetPlayerName(player: GamePlayer, message: GameMessageSetPlayerName) {
        if (player.ready) {
            this.websocketController.sendTo(player.id, {
                type: 'toast',
                message: 'Your name is already set.'
            })
        }
        player.name = message.name?.trim()
    }

    private async onPlayerReady(player: GamePlayer) {
        // Check game already started
        if (this.gameState.status !== 'not_started') {
            this.websocketController.sendTo(player.id, {
                type: 'toast',
                message: 'Game already in-progress.'
            })
            return
        }

        // Check for duplicate names
        if (player.name && this.gameState.players.filter(p => p.name === player.name).length > 1) {
            this.websocketController.sendTo(player.id, {
                type: 'toast',
                message: 'That name is taken.'
            })
            return
        }

        player.ready = true

        // Check for insufficent players
        if (this.gameState.players.length === 1) {
            this.websocketController.sendTo(player.id, {
                type: 'toast',
                message: 'Waiting for at least one more player to join.'
            })
            return
        }

        // Check that all players are ready
        if (this.gameState.players.filter(p => p.ready).length < this.gameState.players.length) {
            this.websocketController.sendTo(player.id, {
                type: 'toast',
                message: 'Waiting for other players to be ready.'
            })
            return
        }

        this.countdownToStart()
    }

    private async countdownToStart() {
        this.gameState.status = 'starting'
        this.websocketController.sendToAll({
            type: 'toast',
            message: 'Game starting in 3'
        })
        this.gameState.countdownPromise = delay(1000)
            .then(() => {
                this.websocketController.sendToAll({
                    type: 'toast',
                    message: 'Game starting in 2'
                })
            })
            .then(() => delay(1000))
            .then(() => {
                this.websocketController.sendToAll({
                    type: 'toast',
                    message: 'Game starting in 1'
                })
            })
            .then(() => delay(1))
            .then(() => this.start())

    }

    private start() {
        if (this.gameState.status !== 'starting') {
            return
        }

        this.gameState.status = 'active'
        this.gameState.startTime = Date.now()
        this.gameState.keys = this.selectKeys()
        this.chooseMole()
        this.sendPublicGameState()
    }

    private selectKeys() {
        const shuffledAlphabet = ALPHABET.sort(() => 0.5 - Math.random());
        return shuffledAlphabet.slice(0, KEYS_COUNT);
    }

    private chooseMole() {
        const notMoles = this.gameState.players.filter(p => p.role !== 'mole')
        const newMole = notMoles[Math.floor(Math.random() * notMoles.length)];
        this.gameState.players.forEach(player => player.role = player.id === newMole.id ? 'mole' : 'whacker')
        return newMole
    }

    private onPressKey(player: GamePlayer, message: GameMessageKeyPress) {
        if (this.gameState.status !== 'active') {
            return
        }
        player.role === 'mole' ? this.onMolePressKey(player, message) : this.onWhackerPressKey(player, message)
    }

    private onMolePressKey(player: GamePlayer, message: GameMessageKeyPress) {
        const alreadyPressed = this.gameState.moleKeys.some(k => k.key === message.key)
        const pressedKeyCount = this.gameState.moleKeys.length

        // Mole pressed too many keys or invalid key
        if (pressedKeyCount > 0 || alreadyPressed || !this.gameState.keys.includes(message.key)) {
            this.websocketController.sendToAll({
                type: 'rumble',
                rumbleIds: [`player-${player.id}`, `key-${message.key}`]
            })
            player.moleMispresses++
            return
        }

        // Valid press
        this.gameState.moleKeys.push({
            key: message.key,
            pressedAt: Date.now(),
        })

        this.sendPublicGameState()
    }

    private onWhackerPressKey(player: GamePlayer, message: GameMessageKeyPress) {
        const moleKey = this.gameState.moleKeys.find(k => k.key === message.key)

        if (!moleKey) {
            // Whacker misplace
            this.websocketController.sendToAll({
                type: 'rumble',
                rumbleIds: [`player-${player.id}`, `key-${message.key}`]
            })
            player.whackerMispresses++;
            return
        }

        // Whacker valid press
        const delta = Date.now() - moleKey.pressedAt
        this.gameState.moleKeys = this.gameState.moleKeys.filter(k => k.key !== message.key)
        player.whackerPresses++
        this.gameState.players.find(p => p.role === 'mole')!.moleDelta += delta

        // Assess if round end
        this.gameState.whacksInRound++
        if (this.gameState.whacksInRound >= WHACKS_PER_ROUND) {
            this.nextRound()
        }
    }

    private nextRound() {
        if (this.gameState.round + 1 === ROUNDS_PER_GAME) {
            this.finishGame()
            return
        }
        this.gameState.round++
        this.gameState.whacksInRound = 0
        this.gameState.keys = this.selectKeys()

        const currentMole = this.gameState.players.find(p => p.role === 'mole')!
        const newMole = this.chooseMole()
        this.websocketController.sendToAll({
            type: 'rumble',
            rumbleIds: ['keys', 'help-text', `role-badge-${currentMole.id}`, `role-badge-${newMole.id}`]
        })
    }

    private calculateScore(player: GamePlayer) {
        return player.moleDelta
            + (player.whackerPresses * WHACKER_PRESS_BONUS)
            - (player.moleMispresses * MOLE_MISSPRESS_PENALTY)
            - (player.whackerMispresses * WHACKER_MISPRESS_PENALTY)
    }

    private finishGame() {
        this.gameState.status = 'ended'
        const winner = this.gameState!.players.sort((p1, p2) => this.calculateScore(p2) - this.calculateScore(p1))[0]
        this.gameState.winnerId = winner.id
        this.websocketController.sendTo(winner.id, {
            type: 'confetti'
        })
    }

    private sendPublicGameState() {
        const publicGameState: PublicGameState = {
            id: this.gameState.id,
            keys: this.gameState.keys,
            moleKeys: this.gameState.moleKeys,
            round: this.gameState.round,
            status: this.gameState.status,
            whacksInRound: this.gameState.whacksInRound,
            gameProgress: 100 * (this.gameState.round * WHACKS_PER_ROUND + this.gameState.whacksInRound) / (WHACKS_PER_ROUND * ROUNDS_PER_GAME),
            players: this.gameState.players.map(player => ({
                ...player,
                name: player.name || player.id,
                score: this.calculateScore(player)
            })),
            winnerId: this.gameState.winnerId
        }
        this.websocketController.sendToAll({
            type: 'game_state',
            state: publicGameState
        })
    }
}