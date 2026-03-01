const WebSocket = require('ws');
const http = require('http');

// 1. Strict cleaning of password (removes hidden newlines/spaces)
const clean = (str) => (str || "").replace(/[\s\n\r\t]/g, '');
const SYSTEM_PASSWORD = clean(process.env.ImaanManpreet || "Imaan@123");

// 2. Render assigned Port
const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Audio Server is Running");
});

const wss = new WebSocket.Server({ noServer: true });

// 3. Handle WebSocket Upgrade with Modern WHATWG URL API
server.on('upgrade', (request, socket, head) => {
    try {
        const baseURL = `http://${request.headers.host || 'localhost'}`;
        const parsedUrl = new URL(request.url, baseURL);
        const rawToken = parsedUrl.searchParams.get('token') || "";
        
        const provided = clean(decodeURIComponent(rawToken));

        console.log(`--- AUTH ATTEMPT ---`);
        console.log(`Provided: [${provided}]`);
        console.log(`Expected: [${SYSTEM_PASSWORD}]`);
        
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
    } catch (err) {
        console.error("Upgrade Error:", err);
        socket.destroy();
    }
});

wss.on('connection', (ws) => {
    console.log('New Authenticated Client Linked');
    ws.on('message', (data) => {
        // Broadcast binary PCM data to all listeners
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: true });
            }
        });
    });
});

// 4. CRITICAL: Listen on 0.0.0.0 for Render Port Scan
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 SERVER LIVE ON 0.0.0.0:${PORT}`);
    console.log(`🔑 PASSWORD PROTECTED: ${SYSTEM_PASSWORD}\n`);
});
