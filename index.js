// === Auto-Circle Bot for Slither.io (Node.js) ===

const readline = require('readline');
const WebSocket = require('ws');

const state = {
    autoCircle: false,
    angle: 0,
    ws: null
};

const LOOP_INTERVAL = 1000 / 30; // ~30 FPS (less CPU usage)

// Convert radians (0 to 2π) to slither.io angle byte (0-250)
function angleToByte(angle) {
    return Math.floor((angle % (2 * Math.PI)) / (2 * Math.PI) * 250);
}

function sendMouseAngle(ws) {
    if (!state.autoCircle || !ws || ws.readyState !== WebSocket.OPEN) return;

    state.angle += 0.04;
    const angleByte = angleToByte(state.angle);
    const buf = Buffer.alloc(1);
    buf[0] = angleByte;

    ws.send(buf); // Send mouse angle packet
}

function startAutoCircle(ws) {
    if (state.autoCircle) return;
    state.autoCircle = true;
    console.log('[AutoCircle] Started');

    state.loop = setInterval(() => {
        sendMouseAngle(ws);
    }, LOOP_INTERVAL);
}

function stopAutoCircle() {
    state.autoCircle = false;
    clearInterval(state.loop);
    console.log('[AutoCircle] Stopped');
}

function toggleAutoCircle() {
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
        console.log("[!] WebSocket not open.");
        return;
    }

    state.autoCircle ? stopAutoCircle() : startAutoCircle(state.ws);
}

// Connect to Slither.io server
function connectToSlither(serverURL) {
    const ws = new WebSocket(serverURL);
    state.ws = ws;

    ws.on('open', () => {
        console.log(`[+] Connected to ${serverURL}`);

        // Slither.io expects a "login" handshake. We send a dummy skin + nickname packet.
        // This might not fully emulate a real client (used for local testing).
        const joinPacket = Buffer.from([
            115, 10, 0, 0, 4, ...Buffer.from('Bot')
        ]);
        ws.send(joinPacket);

        // Optional: enable auto-circle on connect
        startAutoCircle(ws);
    });

    ws.on('close', () => {
        console.log('[-] Disconnected from server.');
        stopAutoCircle();
    });

    ws.on('error', err => {
        console.error(`[!] Error: ${err.message}`);
    });

    ws.on('message', data => {
        // You can log server data here for debugging
        // console.log("[Server]:", data);
    });
}

// CLI input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', line => {
    const cmd = line.trim().toLowerCase();
    if (cmd === 'toggle') toggleAutoCircle();
});

// === Start here ===
const server = 'wss://148.113.17.85:444/slither'; // Change if needed
connectToSlither(server);

console.log(`Slither.io Bot\nType 'toggle' to start/stop auto-circle.`);