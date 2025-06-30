const WebSocket = require('ws');
const http = require('http');

const server = http.createServer(); // Create a regular HTTP server
const wss = new WebSocket.Server({ server }); // Attach WebSocket server to the HTTP server
// Use whatever you want/have
const port = 8080;

// Store connected clients
const clients = {};

wss.on('connection', function connection(ws) {

    const userId = Math.random().toString(36).substring(7); // Simple unique ID for demonstration
    clients[userId] = ws;
    console.log(`Client ${userId} connected`);

    // Send a welcome message to the newly connected client
    ws.send(JSON.stringify({ type: 'welcome', message: `Welcome, you are client ${userId}` }));

    ws.on('message', function incoming(message) {
        console.log(`Received message from ${userId}: ${message}`);

        // Parse the message 
        const parsedMessage = JSON.parse(message);

        // Broadcast the message to all connected clients
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'chat', sender: userId, text: parsedMessage.text }));
            }
        });
    });

    ws.on('close', () => {
        console.log(`Client ${userId} disconnected`);
        delete clients[userId]; // Remove disconnected client
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for client ${userId}:`, error);
    });
});

server.listen(port, () => {
    console.log(`WebSocket server listening on http://localhost:${port}`);
});