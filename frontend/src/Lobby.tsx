import classNames from "classnames"
import NesContainer from "./nes/NesContainer"
import useGame, { GamePlayer } from "./useGame"
import useSelfUrl from "./useSelfUrl"
import Instructions from "./Instructions"
import { useState } from "react"
import delay from "./delay"

const getPlayerStatus = (player: GamePlayer) => {
    if (player.status !== 'active') {
        return 'disconnecting'
    }

    return player.ready ? '(ready)' : '(waiting)'
}

const PlayerRow = ({ player }: { player: GamePlayer }) => {
    const [name, setName] = useState(player.name)
    const { selfPlayer, setPlayerName } = useGame()
    const isSelf = player.id === selfPlayer?.id

    const updateName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
        setPlayerName(e.target.value)
    }

    const nameField = isSelf && !player.ready
        ? <input type="text" id="player-name" className="nes-input" value={name} onChange={updateName}></input>
        : player.name

    return <div key={player.id} className="lobby-player-row">
        <span className="lobby-player-label">Player</span> {nameField} {getPlayerStatus(player)}
        <i className={classNames('nes-icon', 'star', 'is-small', 'lobby-player-star', !isSelf && 'hidden-star')}></i>
    </div>
}

const GameUrl = () => {
    const { gameState } = useGame()
    const selfUrl = `${useSelfUrl().withoutProtocol}/game/${gameState!.id}`
    const [copied, setCopied] = useState(false)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(selfUrl)
        setCopied(true)
        delay(2000).then(() => setCopied(false))
    }
    return <NesContainer
        title="Game URL"
    >
        <span>Share this URL for other players to join the game!</span>
        <br /><br />
        <div className="lobby-url-copy-container">
        <span>{selfUrl}</span>
        <button
            type="button"
            className="nes-btn is-primary copy-button"
            onClick={copyToClipboard}
        >
            {copied ? 'Copied!' : 'Copy'}
        </button>
        </div>
    </NesContainer>
}

const Players = () => {

    const {
        gameState,
        toast,
        selfPlayer, onReady
    } = useGame()

    return <NesContainer
        title="Lobby"
    >
        {
            gameState!.players.map(player => <PlayerRow player={player} key={player.id} />)
        }
        {toast && (<><br /><span>{toast}</span><br /></>)}
        <br />
        <button
            onClick={onReady}
            disabled={selfPlayer!.ready}
            className={classNames('nes-btn', selfPlayer!.ready && 'is-disabled')}
        >
            I'm Ready
        </button>
    </NesContainer>
}

const Lobby = () => {
    return <>
        <h1><a href="/">Key Mole</a></h1>
        <br />
        <GameUrl />
        <br />
        <Players />
        <br />
        <Instructions />
    </>
}

export default Lobby