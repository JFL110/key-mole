# Key Mole
A quickly-assembled Cloudflare durable objects demo game.

Dev environment hosted @ [keymole-staging.jamesleach.dev](https://keymole-staging.jamesleach.dev)

Production environment hosted @ [keymole.jamesleach.dev](https://keymole.jamesleach.dev)


## Gameplay
Based on whack-a-mole, in this game players take turns being the mole by pressing on of the available keys shown on screen. The other players, whackers, then need to hit the same key as quickly as possible. Points are awarded to the mole for the number of milliseconds that their chosen key is unwhacked, and points are deducted for any player that presses an invalid key.

## Structure
A single worker handles all requests, including those to serve the static frontend from an R2 bucket.

Via the frontend, players create a Websocket which is connected with a durable object with a sharable `gameId`. The durable object maintains a set of multiple websocket connections for the multiple players in the game. The game logic is handled by the durable object, including telling the frontend when to apply css animations to certain elements on the screen, so the frontend simply sends the actions of the player to the durable object and receives updates to the game state to display.

The system also includes a mechanism for reconnecting players within a grace-period window if they become disconnected, so it is possible to hard-refresh the browser whilst playing without interruption.

The frontend is written in React and uses retro-arcade styling from [NES.css](https://nostalgic-css.github.io/NES.css/).

## Running Locally
```
npm i
npm run gen
npm start
```
Navigate to localhost on port 4003.

## Deployment
See the Github workflows.