import useGame from "./useGame"

const GameStarting = () => {
    const { toast } = useGame()
    return <div className='v-center'>
        <h2>{toast ?? 'Waiting for game to start...'}</h2>
    </div>
}

export default GameStarting