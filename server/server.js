const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve client files (when running from server/ dir, go up to client/)
app.use(express.static(path.join(__dirname, '..', 'client')));

const wss = new WebSocket.Server({ server, path: '/ws' });

const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('🟢 Новый игрок подключился');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      console.log('Received:', msg.type, msg);

      switch (msg.type) {
        case 'joinQueue':
          handleJoinQueue(ws, msg);
          break;
        case 'playCard':
        case 'endTurn':
        case 'attack':
          handleGameAction(ws, msg);
          break;
        case 'surrender':
          handleSurrender(ws);
          break;
        default:
          // broadcast unknown for flexibility
          broadcastToRoom(ws, msg);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('🔴 Игрок отключился');
    handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.error('WS error:', err);
  });
});

function handleJoinQueue(ws, msg) {
  ws.playerName = msg.playerName || 'Игрок';
  let foundRoom = false;

  for (let [roomId, room] of rooms) {
    if (room.players.length === 1 && !room.gameStarted) {
      room.players.push(ws);
      ws.roomId = roomId;
      foundRoom = true;
      startGame(roomId);
      break;
    }
  }

  if (!foundRoom) {
    const roomId = 'room_' + Date.now();
    rooms.set(roomId, {
      players: [ws],
      gameStarted: false,
      gameState: {
        turn: 1,
        currentPlayer: 0,
        health: [30, 30],
        board: { left: [[], []], right: [[], []] } // placeholder for future
      }
    });
    ws.roomId = roomId;
    ws.send(JSON.stringify({ type: 'inQueue' }));
  }
}

function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.players.length !== 2) return;

  room.gameStarted = true;

  room.players.forEach((p, i) => {
    p.send(JSON.stringify({
      type: 'gameStart',
      roomId: roomId,
      playerIndex: i,
      gameState: room.gameState
    }));
  });

  console.log(`🎮 Игра началась в комнате ${roomId}`);
}

function handleGameAction(ws, msg) {
  const room = rooms.get(ws.roomId);
  if (!room || !room.gameStarted) return;

  const playerIndex = room.players.indexOf(ws);
  if (playerIndex === -1) return;

  // Simple authoritative updates for demo
  const gs = room.gameState;

  if (msg.type === 'endTurn') {
    gs.currentPlayer = 1 - gs.currentPlayer;
    gs.turn += 1;
  } else if (msg.type === 'attack') {
    const targetIndex = 1 - playerIndex;
    gs.health[targetIndex] = Math.max(0, gs.health[targetIndex] - 5); // demo damage
    if (gs.health[targetIndex] <= 0) {
      endGame(room, playerIndex); // winner is the attacker
      return;
    }
  } else if (msg.type === 'playCard') {
    // Placeholder: in real game would validate card from hand, place on board etc.
    console.log(`Player ${playerIndex} played card ${msg.cardId || 'unknown'} on ${msg.row || 'any'}`);
  }

  // Broadcast updated action + new state
  broadcastToRoom(ws, {
    type: 'gameUpdate',
    action: msg,
    gameState: gs
  });
}

function broadcastToRoom(ws, payload) {
  const room = rooms.get(ws.roomId);
  if (!room) return;

  const message = JSON.stringify(payload);
  room.players.forEach(p => {
    if (p.readyState === WebSocket.OPEN) {
      p.send(message);
    }
  });
}

function endGame(room, winnerIndex) {
  room.players.forEach((p, i) => {
    if (p.readyState === WebSocket.OPEN) {
      p.send(JSON.stringify({
        type: 'gameOver',
        winner: i === winnerIndex,
        finalState: room.gameState
      }));
    }
  });
  rooms.delete(room.players[0]?.roomId || 'unknown');
}

function handleSurrender(ws) {
  const room = rooms.get(ws.roomId);
  if (!room) return;

  const playerIndex = room.players.indexOf(ws);
  const winnerIndex = 1 - playerIndex;

  room.players.forEach((p, i) => {
    if (p.readyState === WebSocket.OPEN) {
      p.send(JSON.stringify({
        type: 'gameOver',
        winner: i === winnerIndex
      }));
    }
  });
  rooms.delete(ws.roomId);
}

function handleDisconnect(ws) {
  if (!ws.roomId) return;

  const room = rooms.get(ws.roomId);
  if (!room) return;

  // Notify other player
  const other = room.players.find(p => p !== ws && p.readyState === WebSocket.OPEN);
  if (other) {
    other.send(JSON.stringify({
      type: 'gameOver',
      winner: true,
      reason: ' opponent disconnected'
    }));
  }

  rooms.delete(ws.roomId);
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Lily Wars server running on port ${PORT}`);
  console.log(`   Serving client from: ${path.join(__dirname, '..', 'client')}`);
});
