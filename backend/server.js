const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 8080;

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
    const lobbyStatus = Object.entries(players)
        .filter(([userId, p]) => userId && p.username && p.username.trim())
        .map(([userId, p]) => ({
            userId,
            username: p.username,
            role: p.role,
            ready: p.ready || false,
            score: p.score || 0,
            class: p.class || "pistol"
        }));
    broadcast("lobby_status", { players: lobbyStatus });
}

function endGame() {
    if (gameStarted) {
        gameStarted = false;
        if (gameTimer) clearTimeout(gameTimer);
        gameTimer = null;
        // Send game_end to all players in all lobbies
        Object.values(lobbies).forEach(lobby => {
            broadcastToLobby(lobby.code, "game_end", { message: "Game has ended!" });
        });
        setTimeout(() => {
            updateLobbyStatus();
        }, 3000);
    }
}

function tryStartGame() {
    const readyPlayers = Object.values(players).filter(p => p.role === 'player' && p.ready);
    if (!gameStarted && readyPlayers.length >= 2) {
        gameStarted = true;
        broadcast("game_start", { message: "Game has started!" });
        // Start timer
        gameTimer = setTimeout(endGame, 30000);
        return true;
    }
    return false;
}

function generateLobbyCode() {
    // Simple 6-character alphanumeric code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createLobby(hostUserId, maxPlayers = 8, name = "Lobby", playerClass = "pistol") {
    const code = generateLobbyCode();
    lobbies[code] = {
        code,
        host: hostUserId,
        players: [hostUserId],
        maxPlayers: Math.min(Math.max(maxPlayers, 2), 8), // Ensure maxPlayers is between 2 and 8
        name,
        createdAt: Date.now()
    };
    players[hostUserId].lobbyCode = code;
    players[hostUserId].isHost = true; // Mark player as host
    players[hostUserId].ready = false; // Initialize ready state
    players[hostUserId].role = 'player'; // Set role to player when creating a lobby
    players[hostUserId].class = playerClass; // Set player class
    console.log(`Lobby created: code=${code}, host=${hostUserId}, maxPlayers=${maxPlayers}, name=${name}, class=${playerClass}`);
    return code;
}

function joinLobby(userId, code, playerClass = "pistol") {
    // Convert code to uppercase for case-insensitive matching
    code = code.toUpperCase();

    if (lobbies[code] && lobbies[code].players.length < lobbies[code].maxPlayers) {
        // Check if player is already in the lobby
        if (lobbies[code].players.includes(userId)) {
            console.log(`User ${userId} is already in lobby ${code}`);
            return true; // Return true as they're already in the lobby
        }

        lobbies[code].players.push(userId);
        players[userId].lobbyCode = code;
        players[userId].isHost = false; // Not the host
        players[userId].ready = false; // Initialize ready state
        players[userId].role = 'player'; // Set role to player when joining a lobby
        players[userId].class = playerClass;

        // Print to console
        console.log(`User ${userId} joined lobby ${code} as class ${playerClass}`);

        // Broadcast updated lobby members to all clients in the same lobby
        setTimeout(() => {
            broadcastToLobby(code, "lobby_members", {
                code,
                members: lobbies[code].players.map(uid => ({
                    userId: uid,
                    username: players[uid]?.username || null,
                    isHost: lobbies[code].host === uid,
                    isReady: players[uid]?.ready || false,
                    class: players[uid]?.class || "pistol"
                }))
            });
        }, 2000);
        broadcastToLobby(code, "lobby_members", {
            code,
            members: lobbies[code].players.map(uid => ({
                userId: uid,
                username: players[uid]?.username || null,
                isHost: lobbies[code].host === uid,
                isReady: players[uid]?.ready || false,
                class: players[uid]?.class || "pistol"
            }))
        });
        return true;
    }
    return false;
}

// Helper function to broadcast to all users in a specific lobby
function broadcastToLobby(lobbyCode, type, payload) {
    if (!lobbies[lobbyCode]) return;

    const message = JSON.stringify({ type, ...payload });
    lobbies[lobbyCode].players.forEach(userId => {
        const player = players[userId];
        if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(message);
        }
    });
}

function showLobbies() {
    // Send all lobbies to all connected clients
    const lobbyList = Object.values(lobbies).map(lobby => {
        const playerNames = lobby.players.map(uid => players[uid]?.username || uid);
        console.log(`Lobby ${lobby.code} (${lobby.name}): Players: [${playerNames.join(', ')}]`);
        return {
            code: lobby.code,
            host: lobby.host,
            name: lobby.name,
            playerCount: lobby.players.length
        };
    });
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
                const playerClass = ["archer", "pistol", "shotgun"].includes(data.class) ? data.class : "pistol";
                if (typeof data.username === 'string' && data.username.trim()) {
                    player.username = data.username.trim();
                }
                const code = createLobby(userId, maxPlayers, name, playerClass);
                ws.send(JSON.stringify({ type: 'lobby_created', code, maxPlayers, name, class: playerClass }));
                showLobbies();
                break;
            }
            case 'join_lobby': {
                console.log('Received join_lobby request:', data); // ADDED LOG
                if (typeof data.username === 'string' && data.username.trim()) {
                    player.username = data.username.trim();
                }
                const code = data.code.toUpperCase();
                const playerClass = ["archer", "pistol", "shotgun"].includes(data.class) ? data.class : "pistol";
                if (!lobbies[code]) {
                    console.log('Lobby not found for code:', code); // ADDED LOG
                    ws.send(JSON.stringify({ type: 'lobby_error', message: 'Lobby not found' }));
                    break;
                }
                if (lobbies[code].players.length >= lobbies[code].maxPlayers) {
                    console.log('Lobby is full for code:', code); // ADDED LOG
                    ws.send(JSON.stringify({ type: 'lobby_error', message: 'Lobby is full' }));
                    break;
                }
                if (joinLobby(userId, code, playerClass)) {
                    player.role = 'player'; // Set role to player when joining a lobby
                    player.class = playerClass;
                    console.log('Sending lobby_joined for code:', code, 'to user:', userId); // ADDED LOG
                    ws.send(JSON.stringify({
                        type: 'lobby_joined',
                        code,
                        lobbyName: lobbies[code].name,
                        isHost: lobbies[code].host === userId,
                        class: playerClass
                    }));

                    // Delay showLobbies to ensure lobby_joined is processed first
                    setTimeout(() => {
                        showLobbies();
                    }, 300); // 100ms delay
                } else {
                    console.log('Could not join lobby for code:', code, 'user:', userId); // ADDED LOG
                    ws.send(JSON.stringify({ type: 'lobby_error', message: 'Could not join lobby' }));
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

            case 'get_lobby_members': {
                const { code } = data;
                if (lobbies[code]) {
                    const memberList = lobbies[code].players.map(uid => ({
                        userId: uid,
                        username: players[uid]?.username || null,
                        isHost: lobbies[code].host === uid,
                        isReady: players[uid]?.ready || false
                    }));
                    // Only send to the requesting client
                    ws.send(JSON.stringify({ type: 'lobby_members', code, members: memberList }));
                    console.log(JSON.stringify({ type: 'lobby_members', code, members: memberList }))
                } else {
                    ws.send(JSON.stringify({ type: 'lobby_error', message: 'Lobby not found' }));
                }
                break;
            }

            case 'get_lobby_members': {
                const code = data.code || player.lobbyCode;
                if (lobbies[code]) {
                    const memberList = lobbies[code].players.map(uid => ({
                        userId: uid,
                        username: players[uid]?.username || null,
                        isHost: lobbies[code].host === uid,
                        isReady: players[uid]?.ready || false
                    }));
                    ws.send(JSON.stringify({ type: 'lobby_members', code, members: memberList }));
                } else {
                    ws.send(JSON.stringify({ type: 'lobby_error', message: 'Lobby not found' }));
                }
                break;
            }

            case 'set_ready': {
                // Handle ready/unready toggle from frontend
                if (typeof data.ready === 'boolean') {
                    player.ready = data.ready;
                    console.log(`${player.username || userId} set ready: ${data.ready}`);

                    // Broadcast updated lobby members to all clients in the same lobby
                    const code = data.code || player.lobbyCode;
                    if (code && lobbies[code]) {
                        const memberList = lobbies[code].players.map(uid => ({
                            userId: uid,
                            username: players[uid]?.username || null,
                            isHost: lobbies[code].host === uid,
                            isReady: players[uid]?.ready || false
                        }));
                        broadcastToLobby(code, "lobby_members", { code, members: memberList });

                        // Check if all players are ready and we have at least 2 players
                        const allReady = lobbies[code].players.every(uid => players[uid]?.ready);
                        const enoughPlayers = lobbies[code].players.length >= 2;

                        if (allReady && enoughPlayers && !gameStarted) {
                            // Remove null/unnamed users before starting the game
                            removeNullUsersFromLobby(code);
                            // Start countdown for game start
                            console.log(`All players ready in lobby ${code}, starting countdown`);
                            broadcastToLobby(code, "game_start_countdown", { countdown: 3 });

                            // After 3 seconds, start the game
                            setTimeout(() => {
                                if (lobbies[code]) {
                                    tryStartGame();
                                    gameStarted = true;
                                    console.log(`Game started in lobby ${code}`);
                                }
                            }, 3000);

                        }
                    }
                }
                break;
            }
            case 'hit':

                // Increase score by 50 if weapon is gun
                if (player.weapon === 'gun') {
                    player.score = (player.score || 0) + 10;
                }
                else if (player.weapon === 'shotgun') {
                    player.score = (player.score || 0) + 40;
                }
                else if (player.weapon === 'archer') {
                    player.score = (player.score || 0) + 70;
                }
                updateLobbyStatus();
                break;
            case 'miss':
                // No action for miss for now
                break;
            case 'get_lobby_status': {
                // Respond with the current lobby's player list and scores
                let code = data.gameId || player.lobbyCode;
                if (code && lobbies[code]) {
                    const playerList = lobbies[code].players.map(uid => ({
                        id: uid,
                        name: players[uid]?.username || null,
                        score: players[uid]?.score || 0
                    }));
                    ws.send(JSON.stringify({ type: 'lobby_status', players: playerList }));
                } else {
                    ws.send(JSON.stringify({ type: 'lobby_status', players: [] }));
                }
                break;
            }

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

// Remove users with null/empty usernames from a lobby and from players
function removeNullUsersFromLobby(lobbyCode) {
    if (!lobbies[lobbyCode]) return;
    // Remove from lobby's player list
    lobbies[lobbyCode].players = lobbies[lobbyCode].players.filter(uid => {
        const p = players[uid];
        return p && p.username && p.username.trim();
    });
    // Remove from players object
    Object.keys(players).forEach(uid => {
        if (players[uid].lobbyCode === lobbyCode && (!players[uid].username || !players[uid].username.trim())) {
            delete players[uid];
        }
    });
}