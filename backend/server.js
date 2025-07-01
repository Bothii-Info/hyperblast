const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });
const port = 8080;

// Player storage
let players = {}; // key: userId, value: { ws, username, role, ready, score }
let gameStarted = false;
let gameTimer = null;

function broadcast(type, payload) {
    const message = JSON.stringify({ type, ...payload });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function updateLobbyStatus() {
    const lobbyStatus = Object.entries(players).map(([userId, p]) => ({
        userId,
        username: p.username || null,
        role: p.role,
        ready: p.ready || false,
        score: p.score || 0
    }));
    broadcast("lobby_status", { players: lobbyStatus });
}

function endGame() {
    if (gameStarted) {
        gameStarted = false;
        clearTimeout(gameTimer);
        gameTimer = null;
        broadcast("game_end", { message: "Game has ended!" });
        // Optionally reset player ready states and scores
        Object.values(players).forEach(p => {
            if (p.role === 'player') {
                p.ready = false;
                p.score = 0;
            }
        });
        updateLobbyStatus();
    }
}

function tryStartGame() {
    const readyPlayers = Object.values(players).filter(p => p.role === 'player' && p.ready);
    if (!gameStarted && readyPlayers.length >= 4) {
        gameStarted = true;
        broadcast("game_start", { message: "Game has started!" });
        // Start 100 second timer
        gameTimer = setTimeout(endGame, 100 * 1000);
    }
}

wss.on('connection', function connection(ws) {
    const userId = Math.random().toString(36).substring(2, 9);

    players[userId] = { ws, role: 'spectator', ready: false, score: 0 };

    console.log(`Client ${userId} connected`);
    ws.send(JSON.stringify({ type: 'welcome', userId }));

    ws.on('message', function incoming(message) {
        let data;
        try {
            data = JSON.parse(message);
        } catch (err) {
            console.error("Invalid JSON:", message);
            return;
        }

        const player = players[userId];
        if (!player) return;

        switch (data.type) {
            case 'join':
                player.role = data.role === 'player' ? 'player' : 'spectator';
                player.username = data.username || null;
                player.ready = false;
                player.score = 0;
                console.log(`${userId} joined as ${player.role}`);
                updateLobbyStatus();
                break;

            case 'ready':
                if (player.role === 'player') {
                    player.ready = true;
                    console.log(`${player.username || userId} is ready`);
                    updateLobbyStatus();
                    tryStartGame();
                }
                break;

            case 'score':
                if (player.role === 'player') {
                    player.score = data.score || 0;
                    updateLobbyStatus(); // Optional: could throttle this
                }
                break;

            default:
                console.warn("Unknown message type:", data.type);
        }
    });

    ws.on('close', () => {
        console.log(`Client ${userId} disconnected`);
        delete players[userId];
        updateLobbyStatus();
    });

    ws.on('error', (err) => {
        console.error(`WebSocket error for ${userId}:`, err);
    });
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// // Join as player
// { "type": "join", "role": "player", "username": "AceShooter" }

// // Join as spectator
// { "type": "join", "role": "spectator" }

// // Ready up
// { "type": "ready" }

// // Send score update
// { "type": "score", "score": 3 }