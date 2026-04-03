const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = new Map();
const matchmakingQueue = []; // Очередь поиска игры

io.on('connection', (socket) => {
  console.log('✅ Игрок подключился:', socket.id);

  // === МАТЧМЕЙКИНГ ===
  socket.on('find-match', () => {
    console.log('🔍 Игрок ищет матч:', socket.id);
    
    // Проверяем есть ли кто-то в очереди
    if (matchmakingQueue.length > 0) {
      // Находим соперника
      const opponent = matchmakingQueue.shift();
      
      // Создаём комнату
      const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
      rooms.set(roomId, {
        players: [opponent.id, socket.id],
        gameState: {},
        createdAt: Date.now()
      });
      
      // Подключаем обоих игроков
      opponent.join(roomId);
      socket.join(roomId);
      
      // Отправляем уведомление обоим
      io.to(opponent.id).emit('match-found', { roomId, opponent: socket.id });
      io.to(socket.id).emit('match-found', { roomId, opponent: opponent.id });
      
      console.log(`🎮 Матч найден! Комната: ${roomId}`);
    } else {
      // Добавляем в очередь
      matchmakingQueue.push(socket);
      socket.emit('matchmaking-started', { position: matchmakingQueue.length });
      console.log('⏳ Игрок добавлен в очередь:', socket.id);
    }
  });
  
  // Отмена поиска
  socket.on('cancel-matchmaking', () => {
    const index = matchmakingQueue.findIndex(p => p.id === socket.id);
    if (index > -1) {
      matchmakingQueue.splice(index, 1);
      console.log('❌ Игрок отменил поиск:', socket.id);
    }
  });

  // Создание комнаты (для игры с другом)
  socket.on('create-room', (data) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    rooms.set(roomId, {
      players: [socket.id],
      gameState: data.gameState || {},
      createdAt: Date.now()
    });
    socket.join(roomId);
    socket.emit('room-created', { roomId });
    console.log(`🏠 Комната создана: ${roomId}`);
  });

  // Присоединение к комнате
  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.players.length < 2) {
      room.players.push(socket.id);
      socket.join(roomId);
      io.to(roomId).emit('game-start', { 
        players: room.players,
        gameState: room.gameState 
      });
      console.log(`👥 Игрок присоединился к комнате: ${roomId}`);
    } else {
      socket.emit('error', { message: 'Комната не найдена или заполнена' });
    }
  });

  // Ход игрока
  socket.on('play-card', (data) => {
    socket.to(data.roomId).emit('opponent-move', data);
  });

  // PASS
  socket.on('pass-turn', (data) => {
    socket.to(data.roomId).emit('opponent-pass', data);
  });

  // Использование способности лидера
  socket.on('use-leader', (data) => {
    socket.to(data.roomId).emit('opponent-leader', data);
  });

  // Выход из комнаты
  socket.on('leave-room', (data) => {
    if (data.roomId) {
      socket.leave(data.roomId);
      rooms.delete(data.roomId);
    }
    // Удаляем из очереди матчмейкинга
    const index = matchmakingQueue.findIndex(p => p.id === socket.id);
    if (index > -1) matchmakingQueue.splice(index, 1);
  });

  // Конец игры
  socket.on('game-end', (data) => {
    socket.to(data.roomId).emit('game-result', data);
    rooms.delete(data.roomId);
    console.log(`🏁 Игра в комнате ${data.roomId} завершена`);
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log('❌ Игрок отключился:', socket.id);
    
    // Удаляем из очереди
    const index = matchmakingQueue.findIndex(p => p.id === socket.id);
    if (index > -1) matchmakingQueue.splice(index, 1);
    
    // Уведомляем комнату
    rooms.forEach((room, roomId) => {
      if (room.players.includes(socket.id)) {
        io.to(roomId).emit('opponent-disconnected');
        rooms.delete(roomId);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Доступен по: http://193.148.59.127:${PORT}`);
  console.log(`👥 Ожидание игроков...`);
});