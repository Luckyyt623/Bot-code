module.exports = function generateSkinPacket(nickname = "SlitherControl+", colors = ['#ff0000', '#00ff00']) {
  const packet = [115, 10, 0, nickname.length]; // s, protocol=11, skinID=0
  for (let i = 0; i < nickname.length; i++) {
    packet.push(nickname.charCodeAt(i));
  }

  // Append custom skin (format: 255,255,255,...)
  packet.push(255, 255, 255, 0, 0, 0);
  packet.push(Math.floor(Math.random() * 256));
  packet.push(Math.floor(Math.random() * 256));
  packet.push(colors.length);

  colors.forEach(hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    packet.push(r, g, b);
  });

  return new Uint8Array(packet);
};