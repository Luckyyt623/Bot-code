// === index.js: Entry Point to Run Bot on Multiple Servers ===
const WebSocket = require("ws");
const readline = require("readline");
const botCode = require("./botcode"); // Assume your full bot logic is exported or auto-applied

// Custom skin data (as RGB array) for each bot, optional
const customSkin = [
  255, 255, 255, 0, 0, 0, Math.floor(Math.random()*255), Math.floor(Math.random()*255), 3,
  255, 0, 0,
  0, 255, 0,
  0, 0, 255
];

const servers = [
  "wss://148.113.17.85:444/slither",
  "wss://15.235.216.115:443/slither"
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function connectToServer(serverUrl) {
  const ws = new WebSocket(serverUrl);

  ws.binaryType = "arraybuffer";

  ws.on("open", () => {
    console.log(`[+] Connected to ${serverUrl}`);

    // Press 'T' twice logic (send "T" equivalent)
    setTimeout(() => {
      ws.send(new Uint8Array([84])); // Press T
      setTimeout(() => {
        ws.send(new Uint8Array([84])); // Press T again
        console.log("[i] Simulated double 'T' press to start bot.");
      }, 300);
    }, 1000);

    // Optionally send custom skin packet if supported
    if (customSkin.length > 0) {
      const skinPacket = new Uint8Array([112, ...customSkin]);
      ws.send(skinPacket);
      console.log("[i] Custom skin packet sent.");
    }
  });

  ws.on("message", (data) => {
    // Handle incoming data (you could parse leaderboard, minimap, etc.)
    const byteArray = new Uint8Array(data);
    if (byteArray[0] === 112) {
      console.log("[Data] Leaderboard / Skin confirmed packet.");
    }
  });

  ws.on("close", () => {
    console.log(`[-] Disconnected from ${serverUrl}`);
  });

  ws.on("error", (err) => {
    console.error(`[!] Error on ${serverUrl}:`, err.message);
  });
}

// Connect to all servers
servers.forEach(server => connectToServer(server));
