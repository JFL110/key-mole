import classNames from 'classnames';
import NesContainer from './nes/NesContainer';
import useGame, { GamePlayer, MoleKey } from './useGame';
import useSelfUrl from './useSelfUrl';
import { nanoid } from 'nanoid'
import Rumbler from './Rumbler';
import React, { useMemo } from 'react';

const KEYS_PER_ROW = 5

interface KeyButtonProps {
    keyCode: string
    moleKeys: MoleKey[]
    onPressKey: (key: string) => void
}

const KeyButton = ({
    keyCode,
    moleKeys,
    onPressKey,
}: KeyButtonProps) => {
    const isMoleKey = moleKeys.find(moleKey => moleKey.key === keyCode)
    return <Rumbler id={`key-${keyCode}`}>
        <button
            className={classNames('nes-btn', isMoleKey && 'is-success', 'key-button')}
            onClick={() => onPressKey(keyCode)}
        >
            {keyCode}
        </button>
    </Rumbler>
}

interface PlayerScoreBoxArgs {
    player: GamePlayer
    isSelf: boolean
}

const PlayerScoreBox = ({ player, isSelf }: PlayerScoreBoxArgs) => {
    return <Rumbler
        id={`player-${player.id}`}
    >
        <NesContainer
            title={player.name}
            cls='player-box'
        >
            {isSelf && <i className="nes-icon star player-star"></i>}
            <Rumbler id={`role-badge-${player.id}`}>
                <div className="nes-badge">
                    <span className={classNames(player.role === 'mole' ? 'is-success' : 'is-error', 'relative-badge')}>{player.role}</span>
                </div>
            </Rumbler>
            <br />
            <span className={classNames('nes-text', player.score > 0 ? 'is-success' : 'is-error', 'score-item')}>{player.score}</span>
        </NesContainer>
    </Rumbler>
}

const ScoreBoxes = () => {
    const {
        selfId,
        gameState,
        selfPlayer,
    } = useGame()
    const players = [selfPlayer!, ...gameState!.players.filter(p => p.id !== selfId)]

    return <div className='player-score-container'>
        {
            players.map(player => <PlayerScoreBox
                key={player.id}
                player={player}
                isSelf={player.id === selfId}
            />
            )
        }
    </div>
}

function* chunks<T>(arr: T[], n: number): Generator<T[], void> {
    for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
    }
}

const Keys = () => {
    const { gameState, onPressKey } = useGame()
    return <Rumbler id='keys'><div>{
        [...chunks(gameState!.keys, KEYS_PER_ROW)]
            .map(keyGroup => (
                <React.Fragment key={keyGroup.join('')}>
                    {keyGroup.map(key => <KeyButton
                        key={key}
                        keyCode={key}
                        moleKeys={gameState?.moleKeys ?? []}
                        onPressKey={onPressKey}
                    />)
                    }
                    <br />
                </React.Fragment>
            ))
    }
    </div>
    </Rumbler>
}

const GameFinished = () => {
    const { gameState, sendNewGameLink } = useGame()
    const newGameId = useMemo(() => nanoid(11), [])
    const selfUrl = useSelfUrl()
    const newGameUrl = `${selfUrl.href}/game/${newGameId}`
    const winnerName = gameState!.players.find(p => p.id === gameState!.winnerId)?.name ?? gameState!.winnerId

    return <NesContainer title="Game Finished">
        <h2>{winnerName ?? '?'} wins!</h2>
        <br />
        <a
            href={newGameUrl}
            className="nes-btn is-success"
            onClick={() => sendNewGameLink(newGameId)}>Start a New Game</a>

        {
            gameState!.players.filter(p => p.newGameId).map(p => (
                <>
                    <br />
                    <br />
                    <a
                        href={`${selfUrl.href}/game/${p.newGameId}`}
                        className="nes-btn is-success"
                    >Join new game by {p.name}</a>
                </>
            ))
        }
    </NesContainer>
}

const HelpText = () => {
    const { selfPlayer } = useGame()
    const helpText = selfPlayer!.role === 'whacker'
        ? 'Hit the keys that activate!'
        : 'Activate one key at a time!'

    return <Rumbler id='help-text'>
        <NesContainer title="Help">
            {helpText}
        </NesContainer>
    </Rumbler>
}

const Game = () => {
    const { gameState } = useGame()

    return (
        <>
            <div className="game-process-container">
                <progress className="nes-progress is-success" value={gameState!.gameProgress} max="100"></progress>
            </div>
            <br />
            <ScoreBoxes />
            <br />
            {
                gameState!.status === 'active' ? <>
                    <Keys />
                    <br />
                    <HelpText />
                </> : <GameFinished />
            }
        </>
    )
}

export default Game