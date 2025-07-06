const WebSocket = require("ws");

// === CONFIG ===
const serverUrl = "wss://94.72.180.82:475/slither";
const nickname = "LuckyBot";
const protocolVersion = 11;
const skinId = 0;

// === Connect ===
const ws = new WebSocket(serverUrl, {
  origin: "http://slither.io",
});

ws.binaryType = "arraybuffer";

ws.on("open", () => {
  console.log("🟢 Connected to Slither.io server");
});

ws.on("message", (data) => {
  const type = String.fromCharCode(new Uint8Array(data)[2]);

  if (type === "6") {
    console.log("✅ Received Pre-init packet");
    const secret = [...new Uint8Array(data)].slice(3);
    const answer = solvePreInit(secret);
    const answerBuffer = Buffer.from(answer);
    ws.send(answerBuffer);
    console.log("📤 Sent challenge answer");

    // Wait a bit then send nickname/skin packet
    setTimeout(() => sendJoinPacket(ws, nickname, skinId), 100);
  } else if (type === "a") {
    console.log("✅ Initial setup complete. Game start.");
  }
});

ws.on("error", (err) => {
  console.error("❌ WebSocket error:", err.message);
});

ws.on("close", () => {
  console.log("🔌 Disconnected");
});


// === Solve "Pre-init" packet challenge ===
function solvePreInit(secret) {
  const result = [];
  let globalValue = 0;
  for (let i = 0; i < 24; i++) {
    let value1 = secret[17 + i * 2];
    if (value1 <= 96) value1 += 32;
    value1 = (value1 - 98 - i * 34) % 26;
    if (value1 < 0) value1 += 26;

    let value2 = secret[18 + i * 2];
    if (value2 <= 96) value2 += 32;
    value2 = (value2 - 115 - i * 34) % 26;
    if (value2 < 0) value2 += 26;

    let interimResult = (value1 << 4) | value2;
    let offset = interimResult >= 97 ? 97 : 65;
    interimResult -= offset;

    if (i === 0) globalValue = 2 + interimResult;

    result.push((interimResult + globalValue) % 26 + offset);
    globalValue += 3 + interimResult;
  }

  return result;
}

// === Send Join Packet (nickname + skin ID) ===
function sendJoinPacket(ws, nick, skin) {
  const nickBytes = Buffer.from(nick);
  const packet = Buffer.alloc(4 + nickBytes.length);

  packet[0] = 115; // 's'
  packet[1] = protocolVersion - 1;
  packet[2] = skin;
  packet[3] = nickBytes.length;
  nickBytes.copy(packet, 4);

  ws.send(packet);
  console.log(`📤 Sent nickname "${nick}" with skin ID ${skin}`);
}