const WebSocket = require('ws');
const http = require('http');

// This regex removes ANY whitespace, newlines, or invisible characters
const clean = (str) => str.replace(/[\s\n\r\t]/g, '');

const SYSTEM_PASSWORD = clean(process.env.ImaanManpreet || "Imaan@123"); 
const PORT = process.env.PORT || 10000;

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    // Use the modern WHATWG URL parser for better reliability
    const fullUrl = new URL(request.url, `http://${request.headers.host}`);
    const rawToken = fullUrl.searchParams.get('token') || "";
    
    // Clean both sides strictly
    const provided = clean(decodeURIComponent(rawToken));

    console.log(`--- FORCE-CLEANED AUTH ---`);
    console.log(`Final Provided: [${provided}]`);
    console.log(`Final Expected: [${SYSTEM_PASSWORD}]`);
    
    if (provided !== SYSTEM_PASSWORD) {
        console.log("RESULT: ❌ STILL NOT MATCHING");
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    console.log("RESULT: ✅ ACCESS GRANTED");
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data, { binary: true });
            }
        });
    });
});

server.listen(PORT, () => console.log(`Server running. Expecting: ${SYSTEM_PASSWORD}`));
