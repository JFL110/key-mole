interface Connection {
    id: string
    actorId: string
    socket: WebSocket
}

interface WebsocketControllerArgs {
    onOpen?: (actorId: string) => void
    onMessage: (actorId: string, message: any) => void
    onClose?: (actorId: string) => void
}

export class WebsocketController {
    connections: Connection[]
    idCounter: number
    onOpen?: (actorId: string) => void
    onMessage: (actorId: string, message: any) => void
    onClose?: (actorId: string) => void

    constructor({ onOpen, onMessage, onClose }: WebsocketControllerArgs) {
        this.connections = [];
        this.idCounter = 0
        this.onOpen = onOpen
        this.onMessage = onMessage
        this.onClose = onClose
    }

    async sendToAll(message: any) {
        console.log('sending message', message)
        this.connections.forEach(connection => {
            try {
                connection.socket.send(JSON.stringify(message))
            } catch (err) {
                console.error(`Error sending message to ${connection.id} - ignoring`, err)
            }
        })
    }

    async sendTo(actorId: string, message: any) {
        this.connections.filter(connection => connection.actorId === actorId)
            .forEach(connection => {
                try {
                    connection.socket.send(JSON.stringify(message))
                } catch (err) {
                    console.error(`Error sending message to ${connection.id} - ignoring`, err)
                }
            })
    }


    async open(actorId: string) {
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        server.accept();

        const id = `c-${this.idCounter++}`
        this.connections.push({ id, actorId, socket: server })
        console.log(`Opened new connection to ${actorId}:${id} - now have ${this.connections.length} connections.`)

        server.addEventListener('message', (event) => {
            this.onMessage(actorId, JSON.parse(event.data as string))
        });

        server.addEventListener('close', (closeEvent) => {
            this.connections = this.connections.filter(s => s.id !== id)
            console.log(`Closing connection to ${actorId}:${id} - now have ${this.connections.length} connections.`)
            try {
                new Promise((resolve, reject) => {
                    try {
                        server.close(closeEvent.code, "Closing WebSocket");
                        resolve(true);
                    } catch (err) {
                        reject(err)
                    }
                });
            } catch (err) {
                console.warn('Error closing Websocket, ignoring', err)
            }
            this.onClose?.(actorId)
        });

        this.onOpen?.(actorId)

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }
}