import Game from './Game';
import GameStarting from './GameStarting';
import Lobby from './Lobby';
import useGame from './useGame';


function App() {
  const {
    connected,
    gameState,
    selfPlayer,
    error,
  } = useGame()

  if (error) {
    return <div className='v-center'>
      <div>
        <h1><a href="/">Key Mole</a></h1>
        <br />
        <h3>Unable to load this game, maybe it's already in progress.</h3>
        <br />
        <a
          href="/"
          className='nes-btn'
        >
          Go Back
        </a>
      </div>
    </div>
  }

  if (!connected || !gameState || !selfPlayer) {
    return <div className='v-center'>
      <h2>Loading...</h2>
    </div>
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
