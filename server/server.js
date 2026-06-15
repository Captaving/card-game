const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

app.use(express.static('.'));

const wss = new WebSocket.Server({ server, path: '/ws' });

const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('🟢 Новый игрок подключился');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      console.log('Received:', msg.type);

      switch (msg.type) {
        case 'joinQueue':
          handleJoinQueue(ws, msg);
          break;
        case 'playerReady':
        case 'playCard':
        case 'endTurn':
        case 'attack':
          broadcastToRoom(ws, msg);
          break;
        case 'surrender':
          handleSurrender(ws);
          break;
      }
    } catch (e) {
      console.error('Error:', e);
    }
  });

  ws.on('close', () => {
    console.log('🔴 Игрок отключился');
  });
});

function handleJoinQueue(ws, msg) {
  ws.playerName = msg.playerName || 'Игрок';
  let foundRoom = false;

  for (let [roomId, room] of rooms) {
    if (room.players.length === 1) {
      room.players.push(ws);
      ws.roomId = roomId;
      foundRoom = true;
      startGame(roomId);
      break;
    }
  }

  if (!foundRoom) {
    const roomId = 'room_' + Date.now();
    rooms.set(roomId, { players: [ws], gameState: { turn: 0, currentPlayer: 0, health: [30,30] } });
    ws.roomId = roomId;
    ws.send(JSON.stringify({ type: 'inQueue' }));
  }
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (room.players.length !== 2) return;

  room.players.forEach((p, i) => {
    p.send(JSON.stringify({
      type: 'gameStart',
      roomId: roomId,
      playerIndex: i,
      gameState: room.gameState
    }));
  });
}

function broadcastToRoom(ws, msg) {
  const room = rooms.get(ws.roomId);
  if (!room) return;

  room.players.forEach(p => {
    if (p.readyState === WebSocket.OPEN) {
      p.send(JSON.stringify({ type: 'gameUpdate', action: msg }));
    }
  });
}

function handleSurrender(ws) {
  const room = rooms.get(ws.roomId);
  if (room) {
    room.players.forEach(p => p.send(JSON.stringify({ type: 'gameOver', winner: p !== ws })));
    rooms.delete(ws.roomId);
  }
}

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
