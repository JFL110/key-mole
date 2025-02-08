const nonSpaPrefixes = [
    '/assets/',
    // Prefixes for local development only
    '/@',
    '/src/',
    '/node_modules/',
]

const isSpaRequest = (path: string) => !nonSpaPrefixes.some(p => path.startsWith(p))

export default {
    async fetch(request, env): Promise<Response> {
        const url = new URL(request.url)

        // Ping check
        if (url.pathname === '/ping') {
            return new Response('pong')
        }

        // Open websocket
        if (url.pathname.startsWith("/api/websocket")) {
            if (request.headers.get('Upgrade') !== 'websocket') {
                return new Response('Durable Object expected Upgrade: websocket', { status: 426 });
            }

            const gameId = url.searchParams.get('gameId')
            if (!gameId || gameId === 'null') {
                console.warn('Bad request - missing gameId')
                return new Response(null, { status: 400, statusText: 'Missing GameId' });
            }

            console.log('Starting websocket connection')
            let id = env.GAME_CONTROLLER.idFromName(gameId);
            let stub = env.GAME_CONTROLLER.get(id);
            return stub.fetch(request);
        }

        // Frontend SPA routing
        url.host = env.FRONTEND_HOST
        url.protocol = env.FRONTEND_PROTOCOL
        if (isSpaRequest(url.pathname)) {
            url.pathname = '/index.html'
        }
        url.pathname = `${env.FRONTEND_PATH_PREFIX}${url.pathname}`

        return fetch(new Request(url, request))

    }
} satisfies ExportedHandler<Env>;

export { GameController } from './gameController'