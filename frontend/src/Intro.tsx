import { nanoid } from "nanoid"
import Instructions from "./Instructions"
import useSelfUrl from "./useSelfUrl"

const Intro = () => {
    const newGameUrl = `${useSelfUrl().href}/game/${nanoid(11)}`

    return <>
        <h1>Key Mole</h1>
        <br />
        <h4>Key Mole is a demo game using websockets and Cloudflare durable objects.</h4>
        <br />
        <br />
        <Instructions />
        <br />
        <a
            href={newGameUrl}
            className="nes-btn is-success">
            Start  Game
        </a>
    </>
}

export default Intro