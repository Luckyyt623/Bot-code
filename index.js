const WebSocket = require('ws');
const generateSkinPacket = require('./skin');
const runBot = require('./bot');

const servers = [
  "wss://151.101.0.133:444/slither",
  "wss://151.101.0.134:444/slither",
  // ⬅️ Add more manually or fetch from API
];

servers.forEach((url, i) => {
  const ws = new WebSocket(url);
  let snakeId = null;

  ws.on('open', () => {
    console.log(`✅ Connected to ${url}`);
    ws.send(new Uint8Array([99])); // Send login handshake
    ws.send(generateSkinPacket("LuckyBot", ['#ff0000', '#00ff00']));
  });

  ws.on('message', (data) => {
    const type = String.fromCharCode(data[2]);

    if (type === 's') {
      console.log(`🧍 Spawned snake on ${url}`);
    }

    if (type === 'l') {
      console.log(`📊 Leaderboard from ${url}`);
      // Optional: decode leaderboard
    }

    if (type === 'u') {
      console.log(`🗺️ Minimap update`);
    }
  });

  ws.on('close', () => console.log(`❌ Disconnected from ${url}`));
  ws.on('error', err => console.log(`⚠️ Error: ${err.message}`));

  // Start bot after a short delay
  setTimeout(() => {
    runBot(ws, snakeId);
  }, 3000);
});