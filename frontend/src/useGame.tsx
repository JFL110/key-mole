import React, { useEffect, useState } from 'react'
import useWebSocket from 'react-use-websocket'
import confetti from 'canvas-confetti'
import useSelfUrl from './useSelfUrl';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export interface MoleKey {
    key: string
    pressedAt: number
}

export interface GamePlayer {
    id: string
    name: string
    score: number
    ready: boolean
    role?: 'mole' | 'whacker'
    moleMispresses: number
    whackerMispresses: number
    moleDelta: number
    whackerPresses: number
    newGameId: string | null
    status: 'active' | 'disconnecting' | 'inactive'
}

export interface PublicGameState {
    id: string
    status: 'not_started' | 'starting' | 'active' | 'ended'
    keys: string[]
    moleKeys: MoleKey[]
    round: number
    whacksInRound: number
    players: GamePlayer[]
    gameProgress: number
    winnerId: string | null
}

interface GameContext {
    connected: boolean
    selfId: string | null
    selfPlayer: GamePlayer | null
    gameState: PublicGameState | null
    onPressKey: (key: string) => void
    onReady: () => void
    toast: string | null
    rumble: {
        isActive: (id: string) => boolean
        activate: (ids: string[]) => void
        deactivate: (id: string) => void
    }
    sendNewGameLink: (gameId: string) => void
    setPlayerName: (gameId: string) => void
}

const Context = React.createContext<GameContext>({
    connected: false,
    selfId: null,
    selfPlayer: null,
    gameState: null,
    onPressKey: () => { },
    onReady: () => { },
    toast: null,
    rumble: {
        isActive: () => false,
        activate: () => { },
        deactivate: () => { }
    },
    sendNewGameLink: () => { },
    setPlayerName: () => { }
})

export const GameContextProvider = ({ children }: { children: React.ReactNode }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('playerId');
    const gameId = window.location.pathname.replace('/game/', '')


    // State
    const [gameState, setGameState] = useState<PublicGameState | null>(null)
    const [selfId, setSelfId] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    const [connected, setConnected] = useState(false)
    const [rumbleIds, setRumbleIds] = useState<string[]>([])

    // Derrived state
    const gameIsActive = gameState?.status === 'active'
    const selfPlayer = (gameState && self ? gameState.players.find(p => p.id === selfId) : null) ?? null

    // Rumbling
    const rumble = {
        isActive: (id: string) => rumbleIds.includes(id),
        activate: (ids: string[]) => setRumbleIds((existing) => [...new Set([...existing, ...ids])]),
        deactivate: (id: string) => setRumbleIds((existing) => existing.filter(e => e !== id))
    }

    // Websocket
    const selfUrl = useSelfUrl()
    const protocol = selfUrl.href.startsWith('https') ? 'wss' : 'ws'
    const { sendJsonMessage, readyState } = useWebSocket(
        `${protocol}://${selfUrl.withoutProtocol}/api/websocket?gameId=${gameId}&playerId=${playerId}`,
        {
            shouldReconnect: () => true,
            onError: (event) => {
                console.log('Got Error', event)
            },
            onMessage: (event) => {
                const message = JSON.parse(event.data)

                if (!message) {
                    return
                }

                if (message.type === 'game_state') {
                    setGameState(message.state)
                    return
                }
                if (message.type === 'set_self_id') {
                    setSelfId(message.selfId)
                    const url = new URL(window.location.href);
                    url.searchParams.set('playerId', message.selfId);
                    window.history.replaceState(null, '', url);
                    return
                }
                if (message.type === 'toast') {
                    console.log(message.message)
                    setToast(message.message)
                    return
                }
                if (message.type === 'rumble') {
                    rumble.activate(message.rumbleIds)
                    return
                }
                if (message.type === 'confetti') {
                    confetti()
                }
            }
        }
    );

    useEffect(() => {
        setConnected(readyState === 1)
        if (readyState === 1) {
            sendJsonMessage({
                type: 'init'
            })
        }
    }, [readyState])

    // Outbound socket messages
    const onPressKey = (key: string) => sendJsonMessage({
        type: 'press_key',
        key
    })

    const onReady = () => sendJsonMessage({
        type: 'ready'
    })

    const sendNewGameLink = (gameId: string) => sendJsonMessage({
        type: 'new_game_link',
        gameId
    })

    const setPlayerName = (name: string) => sendJsonMessage({
        type: 'set_player_name',
        name
    })

    // Keypresses
    const keyHandler = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase()
        if (!gameIsActive || !ALPHABET.includes(key)) {
            return
        }
        onPressKey(key)
    };

    useEffect(() => {
        window.addEventListener('keydown', keyHandler, false);
        return () => window.removeEventListener('keydown', keyHandler, false);
    }, [gameIsActive]);

    const context = {
        connected,
        selfId,
        selfPlayer,
        gameState,
        onPressKey,
        onReady,
        toast,
        rumble,
        sendNewGameLink,
        setPlayerName
    }

    return <Context.Provider value={context}>{children}</Context.Provider>
}

const useGame = () => React.useContext(Context)

export default useGame