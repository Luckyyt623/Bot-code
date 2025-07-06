// === Node.js-Compatible Auto-Circle Bot for Slither.io ===
// This version avoids browser-specific objects (window, document)
// and simulates circular movement for testing via console.

const readline = require('readline');
const WebSocket = require('ws');

const state = {
    autoCircle: false,
    circleRadius: 100,
    currentAngle: 0,
    ws: null
};

const FRAME_RATE = 60; // 60 updates per second
const LOOP_DELAY = 1000 / FRAME_RATE;

function simulateMouseMove(ws) {
    if (!state.autoCircle || !ws || ws.readyState !== WebSocket.OPEN) return;

    state.currentAngle += 0.05;
    if (state.currentAngle >= Math.PI * 2) state.currentAngle = 0;

    const angleValue = Math.floor((state.currentAngle / (2 * Math.PI)) * 250); // Convert to 0-250 byte angle
    const anglePacket = new Uint8Array([angleValue]);
    ws.send(anglePacket);
}

function startAutoCircle(ws) {
    if (state.autoCircle) return;
    state.autoCircle = true;
    console.log('[AutoCircle] Started');

    const loop = setInterval(() => {
        if (!state.autoCircle || ws.readyState !== WebSocket.OPEN) {
            clearInterval(loop);
            return;
        }
        simulateMouseMove(ws);
    }, LOOP_DELAY);
}

function stopAutoCircle() {
    state.autoCircle = false;
    console.log('[AutoCircle] Stopped');
}

function toggleAutoCircle(ws) {
    if (state.autoCircle) {
        stopAutoCircle();
    } else {
        startAutoCircle(ws);
    }
}

function connectToSlither(serverUrl) {
    const ws = new WebSocket(serverUrl);
    state.ws = ws;

    ws.on('open', () => {
        console.log(`[+] Connected to ${serverUrl}`);

        // Simulate login ping or skin packet if needed here

        // Automatically enable auto-circle
        startAutoCircle(ws);
    });

    ws.on('message', data => {
        // Parse or log packets if needed
    });

    ws.on('close', () => {
        console.log('[-] Disconnected');
        stopAutoCircle();
    });

    ws.on('error', err => {
        console.error('[!] WebSocket error:', err.message);
    });
}

// Command line input to toggle auto-circle manually
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    const cmd = input.trim().toLowerCase();
    if (cmd === 'toggle') {
        toggleAutoCircle(state.ws);
    }
});

// === Start here ===
const serverURL = 'wss://148.113.17.85:444/slither'; // You can change this
connectToSlither(serverURL);

console.log("Type 'toggle' to enable or disable auto-circle");
