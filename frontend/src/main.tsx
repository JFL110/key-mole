import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import "nes.css/css/nes.min.css";
import './index.css'
import { GameContextProvider } from './useGame.tsx';
import Intro from './Intro.tsx';

const element = window.location.pathname.startsWith('/game/')
  ? <GameContextProvider>
    <App />
  </GameContextProvider>
  : <Intro />

createRoot(document.getElementById('root')!).render(element)
