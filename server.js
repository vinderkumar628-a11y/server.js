const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Environment variable with strict trimming
const SYSTEM_PASSWORD = (process.env.ImaanManpreet || "Imaan@123").trim(); 
const PORT = process.env.PORT || 10000;

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// Helper to find hidden characters (like spaces, \r, or %40)
const toHex = (str) => Buffer.from(str).toString('hex');

server.on('upgrade', (request, socket, head) => {
    const { query } = url.parse(request.url, true);
    
    // Fix: Decode URL characters (like @) and trim spaces
    const provided = decodeURIComponent(query.token || "").trim();

    console.log(`--- AUTH ATTEMPT ---`);
    console.log(`Provided: [${provided}] | Hex: ${toHex(provided)}`);
    console.log(`Expected: [${SYSTEM_PASSWORD}] | Hex: ${toHex(SYSTEM_PASSWORD)}`);
    
    if (provided !== SYSTEM_PASSWORD) {
        console.log("RESULT: ❌ Password Mismatch");
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    console.log("RESULT: ✅ Access Granted");
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    console.log('New Authenticated Client Connected');
    ws.on('message', (data) => {
        // Broadcast PCM audio data to all other connected clients
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: true });
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Secure Server active on port ${PORT}`);
    console.log(`System Password: ${SYSTEM_PASSWORD}`);
    console.log(`System Hex: ${toHex(SYSTEM_PASSWORD)}`);
});
