const WebSocket = require('ws');
const generateSkinPacket = require('./skin'); // Creates skin packet
const runBot = require('./bot');              // Your bot behavior

// ✅ List of Slither.io servers
const servers = [
  "wss://148.113.17.85:444/slither",
  "wss://15.235.216.115:443/slither"
];

// 🔁 Connect to each server
servers.forEach((url, index) => {
  const ws = new WebSocket(url);
  let hasPressedT = false;

  ws.on('open', () => {
    console.log(`✅ Connected to ${url}`);

    // Step 1: Handshake packet ("c")
    ws.send(new Uint8Array([99]));

    // Step 2: Send skin + nickname packet ("s")
    const skinPacket = generateSkinPacket("LuckyBot", ['#ff0000', '#00ff00']);
    ws.send(skinPacket);
  });

  ws.on('message', (data) => {
    const type = String.fromCharCode(data[2]);

    if (type === 's' && !hasPressedT) {
      hasPressedT = true;
      console.log(`🐍 Snake spawned on ${url}`);

      // Simulate pressing T twice
      setTimeout(() => {
        console.log(`⌨️  Simulated T press #1`);
        setTimeout(() => {
          console.log(`⌨️  Simulated T press #2 — Starting bot`);
          runBot(ws); // ✅ Call your bot logic
        }, 500);
      }, 300);
    }

    if (type === 'l') {
      console.log(`📊 Leaderboard update from ${url}`);
    }

    if (type === 'u') {
      console.log(`🗺️ Minimap update from ${url}`);
    }
  });

  ws.on('close', () => {
    console.log(`❌ Disconnected from ${url}`);
  });

  ws.on('error', (err) => {
    console.error(`⚠️ Error on ${url}: ${err.message}`);
  });
});