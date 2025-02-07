
interface MoleKey {
    key: string
    pressedAt: number
}

interface GamePlayer {
    id: string
    name: string | null
    ready: boolean
    role?: 'mole' | 'whacker'
    lastMessage?: number
    moleMispresses: number
    whackerMispresses: number
    moleDelta: number
    whackerPresses: number
    status: 'active' | 'disconnecting' | 'inactive'
    newGameId: string | null
}

interface GameState {
    id: string
    status: 'not_started' | 'starting' | 'active' | 'ended'
    players: GamePlayer[]
    countdownPromise?: Promise<any>
    startTime?: number
    keys: string[]
    moleKeys: MoleKey[]
    round: number
    whacksInRound: number
    winnerId: string | null
}

type GameMessageKeyPress = {
    type: 'press_key',
    key: string
}

type GameMessageNewGameLink = {
    type: 'new_game_link',
    gameId: string
}

type GameMessageSetPlayerName = {
    type: 'set_player_name',
    name: string
}

type GameMessage = {
    type: 'init' | 'ready'
} | GameMessageKeyPress | GameMessageNewGameLink | GameMessageSetPlayerName

interface PublicGameState {
    id: string
    status: 'not_started' | 'starting' | 'active' | 'ended'
    keys: string[]
    moleKeys: MoleKey[]
    round: number
    whacksInRound: number
    gameProgress: number
    players: GamePlayer[]
    winnerId: string | null
}