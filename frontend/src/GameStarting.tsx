import useGame from "./useGame"

const GameStarting = () => {
    const { toast } = useGame()
    return <>
        <h2>{toast ?? 'Waiting for game to start...'}</h2>
    </>
}

export default GameStarting