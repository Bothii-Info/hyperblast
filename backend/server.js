const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });
const port = 8080;

// Player storage
let players = {}; // key: userId, value: { ws, username, role, ready, score }
let gameStarted = false;
let gameTimer = null;

// Lobby storage
let lobbies = {};

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

function generateLobbyCode() {
    // Simple 6-character alphanumeric code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createLobby(hostUserId, maxPlayers = 8, name = "Lobby") {
    const code = generateLobbyCode();
    lobbies[code] = {
        code,
        host: hostUserId,
        players: [hostUserId],
        maxPlayers,
        name,
        createdAt: Date.now()
    };
    players[hostUserId].lobbyCode = code;
    console.log(`Lobby created: code=${code}, host=${hostUserId}, maxPlayers=${maxPlayers}, name=${name}`);
    return code;
}

function joinLobby(userId, code) {
    if (lobbies[code] && lobbies[code].players.length < lobbies[code].maxPlayers) {
        lobbies[code].players.push(userId);
        players[userId].lobbyCode = code;
        // Print to console
        console.log(`User ${userId} joined lobby ${code}`);
        // Broadcast updated lobby members
        const memberList = lobbies[code].players.map(uid => ({
            userId: uid,
            username: players[uid]?.username || null
        }));
        broadcast("lobby_members", { code, members: memberList });
        return true;
    }
    return false;
}

function showLobbies() {
    // Send all lobbies to all connected clients
    const lobbyList = Object.values(lobbies).map(lobby => ({
        code: lobby.code,
        host: lobby.host,
        name: lobby.name,
        playerCount: lobby.players.length
    }));
    broadcast("lobby_list", { lobbies: lobbyList });
}

wss.on('connection', function connection(ws) {
    const userId = Math.random().toString(36).substring(2, 9);

    players[userId] = { ws, role: 'spectator', ready: false, score: 0 };

    // On first connection, create a default lobby if none exists
    if (Object.keys(lobbies).length === 0) {
        createLobby(userId, 8, "BBDefault"); // Default lobby with name BBDefault
        showLobbies();
    }

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
            case 'create_lobby': {
                const maxPlayers = typeof data.maxPlayers === 'number' && data.maxPlayers > 4 ? data.maxPlayers : 8;
                const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : "Lobby";
                const code = createLobby(userId, maxPlayers, name);
                ws.send(JSON.stringify({ type: 'lobby_created', code, maxPlayers, name }));
                showLobbies();
                break;
            }
            case 'join_lobby': {
                const { code } = data;
                if (joinLobby(userId, code)) {
                    ws.send(JSON.stringify({ type: 'lobby_joined', code }));
                    showLobbies();
                } else {
                    ws.send(JSON.stringify({ type: 'lobby_error', message: 'Lobby not found or full' }));
                }
                break;
            }
            case 'show_lobbies': {
                showLobbies();
                break;
            }

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