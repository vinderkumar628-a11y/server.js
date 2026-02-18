const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Relay audio bits from ESP8266 to all connected browsers
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});

const port = process.env.PORT || 10000;
server.listen(port, () => console.log(`Relay live on port ${port}`));
