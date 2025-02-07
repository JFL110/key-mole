import Game from './Game';
import GameStarting from './GameStarting';
import Lobby from './Lobby';
import useGame from './useGame';


function App() {
  const {
    connected,
    gameState,
    selfPlayer,
  } = useGame()

  if (!connected || !gameState || !selfPlayer) {
    return <>
      <h2>Loading...</h2>
    </>
  }

  if (gameState.status === 'not_started') {
    return <Lobby />
  }

  if (gameState.status === 'starting') {
    return <GameStarting />
  }

  return <Game />
}

export default App
