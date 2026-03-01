const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// This checks Render's environment, then falls back to your specific password
const SYSTEM_PASSWORD = (process.env.ImaanManpreet || "Imaan@123").trim(); 
const PORT = process.env.PORT || 10000;

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const { query } = url.parse(request.url, true);
   const provided = decodeURIComponent(query.token || "").trim();


    // This log will tell you exactly why it's failing
    console.log(`AUTH: Browser sent [${provided}] | Server expects [${SYSTEM_PASSWORD}]`);
    
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
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: true });
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Secure Server on port ${PORT}`);
    console.log(`Active Password is: ${SYSTEM_PASSWORD}`);
});
