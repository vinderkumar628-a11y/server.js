const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// This value comes from your Render Environment Variables
const SYSTEM_PASSWORD = process.env.Imaan@123 || "default_local_pass"; 
const PORT = process.env.PORT || 3000;

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    
    // AUTHENTICATION CHECK: Only allow connection if token matches
    if (query.token !== SYSTEM_PASSWORD) {
        console.log("Rejected: Invalid Token");
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    console.log('New Authenticated Client Connected');

    ws.on('message', (data) => {
        // BROADCAST: Send audio data to all OTHER authenticated clients
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                // Ensure data is sent as binary for PCM audio
                client.send(data, { binary: true });
            }
        });
    });
});

server.listen(PORT, () => console.log(`Secure Server on port ${PORT}`));
