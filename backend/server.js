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

// Player identity and face data storage
let playerIdentities = {}; // key: userId, value: { username, faceData }

function broadcast(type, payload) {
    const message = JSON.stringify({ type, ...payload });
    console.log(`📡 BROADCAST: Sending ${type} to ${wss.clients.size} clients`);
    if (type === 'game_start') {
        console.log('📡 BROADCAST: game_start payload:', JSON.stringify(payload, null, 2));
    }
    
    let successCount = 0;
    let failCount = 0;
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                successCount++;
            } catch (e) {
                console.error('📡 BROADCAST ERROR: Failed to send to client:', e);
                failCount++;
            }
        } else {
            failCount++;
        }
    });
    
    console.log(`📡 BROADCAST RESULT: ${type} sent to ${successCount} clients, ${failCount} failed/closed`);
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

// Function to prepare player data to be sent to clients
function preparePlayerData(lobbyCode) {
    if (!lobbies[lobbyCode]) return {};
    
    const playerData = {};
    const readyPlayers = lobbies[lobbyCode].players
        .filter(userId => players[userId] && players[userId].ready)
        .map(userId => ({
            userId,
            username: players[userId].username || `Player ${userId}`
        }));
    
    // Map player positions to usernames
    readyPlayers.forEach((player, index) => {
        playerData[index + 1] = player.username;
    });
    
    return playerData;
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
    console.log('=== DEBUG: tryStartGame called ===');
    
    const readyPlayers = Object.entries(players)
        .filter(([userId, p]) => p.role === 'player' && p.ready)
        .map(([userId, p]) => ({ ...p, userId })); // Include userId in the object
    
    console.log(`tryStartGame called: ${readyPlayers.length} ready players`);
    console.log('Ready players details:', readyPlayers.map(p => ({
        userId: p.userId,
        username: p.username,
        role: p.role,
        ready: p.ready
    })));
    
    // DEBUG: Show ALL stored playerIdentities
    console.log('=== STORED PLAYER IDENTITIES ===');
    console.log('Total stored identities:', Object.keys(playerIdentities).length);
    Object.keys(playerIdentities).forEach(uid => {
        const identity = playerIdentities[uid];
        console.log(`UserID ${uid}:`, {
            username: identity.username,
            hasDetectionData: !!identity.detectionData,
            detectionBbox: identity.detectionData?.bbox,
            detectionConfidence: identity.detectionData?.confidence
        });
    });
    
    if (!gameStarted && readyPlayers.length >= 2) {
        gameStarted = true;
        
        // Find the lobby code for these players
        let lobbyCode = null;
        console.log('=== DEBUG: Finding lobby code ===');
        console.log('All lobbies:', Object.keys(lobbies));
        
        Object.entries(lobbies).forEach(([code, lobby]) => {
            console.log(`Checking lobby ${code}:`, {
                players: lobby.players,
                readyPlayerUserIds: readyPlayers.map(p => p.userId)
            });
            
            const lobbyPlayerIds = lobby.players;
            const allPlayersInThisLobby = readyPlayers.every(p => 
                lobbyPlayerIds.some(id => id === p.userId)
            );
            console.log(`Lobby ${code} contains all ready players:`, allPlayersInThisLobby);
            
            if (allPlayersInThisLobby) {
                lobbyCode = code;
                console.log(`Selected lobby code: ${lobbyCode}`);
            }
        });
        
        console.log(`Final lobby code: ${lobbyCode}`);
        
        // Create a map of player positions to usernames for the frontend
        const playerPositions = lobbyCode ? preparePlayerData(lobbyCode) : {};
        console.log('Player positions prepared:', playerPositions);
        
        // Add player identity data if available
        const playerIdentityData = {};
        console.log('=== DEBUG: Building player identity data ===');
        console.log('Current playerIdentities store:', playerIdentities);
        console.log('Player positions to process:', playerPositions);
        
        Object.keys(playerPositions).forEach(position => {
            const username = playerPositions[position];
            console.log(`\n--- Processing position ${position} ---`);
            console.log(`Username from playerPositions: ${username}`);
            
            // Find the userId for this username
            const userId = Object.keys(players).find(id => 
                players[id].username === username
            );
            console.log(`Found userId for ${username}: ${userId}`);
            
            // Check if we have stored data for this userId
            if (userId) {
                const hasStoredData = !!playerIdentities[userId];
                console.log(`Has stored data for ${userId}: ${hasStoredData}`);
                
                if (hasStoredData) {
                    const storedData = playerIdentities[userId];
                    console.log(`Stored data for ${userId}:`, {
                        username: storedData.username,
                        hasDetectionData: !!storedData.detectionData,
                        detectionData: storedData.detectionData
                    });
                }
            }
            
            if (userId && playerIdentities[userId]) {
                console.log(`✅ Adding identity for position ${position}: ${username} (userId: ${userId})`);
                console.log('Identity data:', playerIdentities[userId]);
                playerIdentityData[position] = {
                    userId: userId,
                    username: username,
                    faceData: playerIdentities[userId].faceData,
                    detectionData: playerIdentities[userId].detectionData
                };
            } else {
                console.log(`❌ No stored identity for position ${position}: ${username} (userId: ${userId})`);
                playerIdentityData[position] = {
                    username: username
                };
            }
        });
        
        console.log('=== FINAL PLAYER IDENTITY DATA ===');
        console.log('Broadcasting player identities:', JSON.stringify(playerIdentityData, null, 2));
        
        broadcast("game_start", { 
            message: "Game has started!",
            playerPositions: playerPositions,
            playerIdentities: playerIdentityData
        });
        
        // Start 100 second timer
        gameTimer = setTimeout(endGame, 100 * 1000);
    } else {
        console.log(`Cannot start game: gameStarted=${gameStarted}, readyPlayers=${readyPlayers.length}`);
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
        maxPlayers: Math.min(Math.max(maxPlayers, 2), 8), // Ensure maxPlayers is between 2 and 8
        name,
        createdAt: Date.now()
    };
    players[hostUserId].lobbyCode = code;
    players[hostUserId].isHost = true; // Mark player as host
    players[hostUserId].ready = false; // Initialize ready state
    console.log(`Lobby created: code=${code}, host=${hostUserId}, maxPlayers=${maxPlayers}, name=${name}`);
    return code;
}

function joinLobby(userId, code) {
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

        // Print to console
        console.log(`User ${userId} joined lobby ${code}`);

        // Broadcast updated lobby members to all clients in the same lobby
        broadcastToLobby(code, "lobby_members", {
            code,
            members: lobbies[code].players.map(uid => ({
                userId: uid,
                username: players[uid]?.username || null,
                isHost: lobbies[code].host === uid,
                isReady: players[uid]?.ready || false
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

    console.log(`Client ${userId} connected. Total connections: ${wss.clients.size}`);
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
                if (typeof data.username === 'string' && data.username.trim()) {
                    player.username = data.username.trim();
                }
                player.role = 'player'; // Ensure the creator is set as a player
                const code = createLobby(userId, maxPlayers, name);
                
                // Send lobby created confirmation
                ws.send(JSON.stringify({ type: 'lobby_created', code, maxPlayers, name }));
                
                // Immediately send the lobby members to the creator
                const memberList = lobbies[code].players.map(uid => ({
                    userId: uid,
                    username: players[uid]?.username || null,
                    isHost: lobbies[code].host === uid,
                    isReady: players[uid]?.ready || false
                }));
                
                ws.send(JSON.stringify({ 
                    type: 'lobby_members', 
                    code: code, 
                    members: memberList 
                }));
                
                showLobbies();
                break;
            }
            case 'join_lobby': {
                console.log('Received join_lobby request:', data); // ADDED LOG
                if (typeof data.username === 'string' && data.username.trim()) {
                    player.username = data.username.trim();
                    console.log(`User ${userId} set username to: ${player.username}`);
                }

                const code = data.code.toUpperCase();

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

                if (joinLobby(userId, code)) {
                    player.role = 'player'; // Set role to player when joining a lobby
                    console.log('Sending lobby_joined for code:', code, 'to user:', userId); // ADDED LOG
                    ws.send(JSON.stringify({
                        type: 'lobby_joined',
                        code,
                        lobbyName: lobbies[code].name,
                        isHost: lobbies[code].host === userId
                    }));

                    // Delay showLobbies to ensure lobby_joined is processed first
                    setTimeout(() => {
                        showLobbies();
                    }, 100); // 100ms delay
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
                    // Check if this user is in the lobby, if not, add them
                    if (!lobbies[code].players.includes(userId)) {
                        console.log(`Adding user ${userId} to lobby ${code} as they requested lobby members`);
                        joinLobby(userId, code);
                    }
                    
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

                            // After 3 seconds, start the game using tryStartGame
                            setTimeout(() => {
                                if (lobbies[code]) {
                                    console.log(`Attempting to start game in lobby ${code}`);
                                    tryStartGame();
                                }
                            }, 3000);
                        }
                    }
                }
                break;
            }
            case 'hit':

                // Increase score by 50 if weapon is gun
                if (data.weapon === 'gun') {
                    player.score = (player.score || 0) + 50;
                    updateLobbyStatus();
                }
                break;
            case 'miss':
                // No action for miss for now
                break;

            case 'set_name': {
                // Handle username change from frontend
                const { username, code } = data;
                if (typeof username === 'string' && username.trim() !== '') {
                    player.username = username.trim();
                    console.log(`User ${userId} changed username to: ${player.username}`);
                    
                    // Broadcast updated lobby members to all clients in the same lobby
                    if (code && lobbies[code]) {
                        const memberList = lobbies[code].players.map(uid => ({
                            userId: uid,
                            username: players[uid]?.username || null,
                            isHost: lobbies[code].host === uid,
                            isReady: players[uid]?.ready || false
                        }));
                        broadcastToLobby(code, "lobby_members", { code, members: memberList });
                    }
                }
                break;
            }

            case 'store_face_data': {
                const { faceData, detectionData, lobbyCode, userId: clientUserId } = data;
                console.log('Received store_face_data request:', {
                    hasDetectionData: !!detectionData,
                    lobbyCode,
                    clientUserId,
                    detectionData: detectionData
                });
                
                if (faceData) {
                    // Use the userId from the message if provided, otherwise use the connection userId
                    const userIdToUse = clientUserId || userId;
                    
                    // Store the face data with the player's username
                    const username = players[userIdToUse]?.username || `Player ${userIdToUse.substring(0, 4)}`;
                    storePlayerFaceData(userIdToUse, username, faceData, detectionData);
                    console.log(`Stored face data for user ${userIdToUse} (${username})${detectionData ? ' with detection data' : ''}`);
                    
                    // Log current state of playerIdentities after storing
                    console.log('Current playerIdentities after storing:', Object.keys(playerIdentities).map(uid => ({
                        userId: uid,
                        username: playerIdentities[uid].username,
                        hasDetectionData: !!playerIdentities[uid].detectionData,
                        detectionDataBbox: playerIdentities[uid].detectionData?.bbox
                    })));
                    
                    // Broadcast to all players in the lobby that this player's face data is available
                    if (lobbyCode && lobbies[lobbyCode]) {
                        broadcastToLobby(lobbyCode, "player_face_updated", { 
                            userId: userIdToUse,
                            username: username
                        });
                    }
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

// Store player face data
function storePlayerFaceData(userId, username, faceData, detectionData = null) {
  console.log(`=== STORING PLAYER DATA ===`);
  console.log(`UserID: ${userId}`);
  console.log(`Username: ${username}`);
  console.log(`Has faceData: ${!!faceData}`);
  console.log(`Has detectionData: ${!!detectionData}`);
  
  if (detectionData) {
    console.log(`Detection data:`, {
      bbox: detectionData.bbox,
      confidence: detectionData.confidence,
      username: detectionData.username,
      userId: detectionData.userId,
      timestamp: detectionData.timestamp
    });
  }
  
  playerIdentities[userId] = { 
    username: username || players[userId]?.username || `Player ${userId.substring(0, 4)}`,
    faceData: faceData,
    detectionData: detectionData // Store bbox, confidence, etc.
  };
  
  console.log(`✅ Stored identity for ${userId}:`, {
    username: playerIdentities[userId].username,
    hasDetectionData: !!playerIdentities[userId].detectionData,
    detectionBbox: playerIdentities[userId].detectionData?.bbox
  });
  
  // Show all stored identities after this storage
  console.log(`Current total stored identities: ${Object.keys(playerIdentities).length}`);
  Object.keys(playerIdentities).forEach(uid => {
    console.log(`  - ${uid}: ${playerIdentities[uid].username} (hasDetection: ${!!playerIdentities[uid].detectionData})`);
  });
}