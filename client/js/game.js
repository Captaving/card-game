// ==================== LILY WARS - MAIN GAME LOGIC ====================
let currentDeckForGame = null;
let ws = null;
let currentRoomId = null;
let myPlayerIndex = null;
let gameState = null;

// Utility: show toast notification
window.showToast = function(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2600);
};

// Show specific screen
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.add('active');
}

function showMainMenu() {
  showScreen('screen-main');
  // close ws if open when leaving game?
  if (ws && ws.readyState === WebSocket.OPEN && currentRoomId) {
    // optional: auto surrender on exit, but for now just leave
  }
}

function showMyDecks() {
  showScreen('screen-my-decks');
  renderDecksList();
}

function renderDecksList() {
  const container = document.getElementById('decks-list');
  if (!container) return;
  container.innerHTML = '<h3>Сохранённые колоды</h3>';
  
  if (!savedDecks || savedDecks.length === 0) {
    container.innerHTML += '<p style="margin:20px 0; opacity:0.7;">У вас пока нет колод. Создайте первую!</p>';
    return;
  }

  savedDecks.forEach((deck) => {
    const div = document.createElement('div');
    div.className = 'deck-item';
    div.innerHTML = `
      <strong>${deck.name}</strong><br>
      <small>${deck.faction} • ${deck.cards.length} карт • Влияние: ${deck.cards.reduce((s,c)=>s+c.influence,0)}</small>
    `;
    div.onclick = () => selectDeckForGame(deck);
    container.appendChild(div);
  });
}

function selectDeckForGame(deck) {
  currentDeckForGame = deck;
  showToast(`Колода "${deck.name}" выбрана для игры!`);
  // For now auto-start bot game. Later can choose mode.
  setTimeout(() => {
    startBotGame();
  }, 800);
}

function startBotGame() {
  if (!currentDeckForGame) {
    showToast("Сначала выберите или создайте колоду!");
    showMyDecks();
    return;
  }
  
  showScreen('screen-game');
  showToast("🤖 Игра с ботом началась!");
  
  // Demo: initialize simple local game state for bot mode
  gameState = { turn: 1, currentPlayer: 0, health: [30, 30] };
  myPlayerIndex = 0;
  updateGameUI();
  
  // Log
  logGameAction("Игра с ботом. Ваша колода загружена: " + currentDeckForGame.name);
  
  // Simple bot simulation every 4s if it's bot turn (demo only)
  if (window.botInterval) clearInterval(window.botInterval);
  window.botInterval = setInterval(() => {
    if (document.getElementById('screen-game').classList.contains('active') && gameState.currentPlayer === 1) {
      logGameAction("Бот думает...");
      setTimeout(() => {
        if (gameState) {
          gameState.currentPlayer = 0;
          gameState.turn++;
          updateGameUI();
          logGameAction("Бот закончил ход.");
        }
      }, 1200);
    }
  }, 4500);
}

function startOnlineMatch() {
  showToast("🔍 Поиск соперника...");
  connectWebSocket();
  
  // Get player name from Telegram if available
  let playerName = "Игрок";
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
    playerName = window.Telegram.WebApp.initDataUnsafe.user.first_name || playerName;
  }
  
  // Wait for connection then join
  setTimeout(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'joinQueue', playerName }));
    } else {
      showToast("Не удалось подключиться к серверу. Попробуйте позже.");
    }
  }, 600);
}

// ==================== WEBSOCKET MULTIPLAYER ====================
function connectWebSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }
  
  // Dynamic URL: works both locally and on production (nginx proxy)
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  const protocol = isLocal ? 'ws:' : 'wss:';
  const host = isLocal ? 'localhost:8080' : location.host;
  const url = `${protocol}//${host}/ws`;
  
  console.log('%c[WS] Connecting to', 'color:#88ffaa', url);
  ws = new WebSocket(url);
  
  ws.onopen = () => {
    console.log('%c[WS] Connected successfully', 'color:#88ffaa');
  };
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleServerMessage(msg);
    } catch (e) {
      console.error('WS message parse error', e);
    }
  };
  
  ws.onclose = () => {
    console.log('%c[WS] Connection closed', 'color:#ffaa66');
    ws = null;
    if (currentRoomId) {
      showToast("Соединение с сервером потеряно");
      currentRoomId = null;
    }
  };
  
  ws.onerror = (err) => {
    console.error('[WS] Error', err);
    showToast("Ошибка подключения к серверу");
  };
}

function handleServerMessage(msg) {
  console.log('%c[WS] ←', 'color:#aaffff', msg.type, msg);
  
  switch (msg.type) {
    case 'inQueue':
      showToast("⏳ Ищем соперника... Ожидайте");
      // Could show a dedicated waiting screen in future
      break;
      
    case 'gameStart':
      currentRoomId = msg.roomId;
      myPlayerIndex = msg.playerIndex;
      gameState = msg.gameState || { turn: 1, currentPlayer: 0, health: [30,30] };
      
      showScreen('screen-game');
      updateGameUI();
      showToast(`🎮 Матч найден! Вы — Игрок ${myPlayerIndex + 1}`);
      logGameAction(`Игра началась. Вы игрок #${myPlayerIndex + 1}.`);
      break;
      
    case 'gameUpdate':
      if (msg.gameState) {
        gameState = msg.gameState;
      }
      const action = msg.action || {};
      logGameAction(`Действие: ${action.type || 'update'} от игрока ${action.playerIndex ?? '?'}`);
      updateGameUI();
      break;
      
    case 'gameOver':
      const won = !!msg.winner;
      showToast(won ? "🏆 ПОБЕДА!" : "💀 Поражение...");
      logGameAction(won ? "Вы победили!" : "Вы проиграли.");
      
      setTimeout(() => {
        if (confirm(won ? "Поздравляем с победой! Вернуться в меню?" : "Вы проиграли. Вернуться в меню?")) {
          showMainMenu();
        }
        currentRoomId = null;
        if (ws) ws.close();
      }, 1800);
      break;
      
    default:
      console.log('Unknown server message type:', msg.type);
  }
}

function updateGameUI() {
  if (!gameState) return;
  
  const h0 = document.getElementById('health-p0');
  const h1 = document.getElementById('health-p1');
  const turnEl = document.getElementById('turn-info');
  const roleEl = document.getElementById('player-role');
  
  if (h0) h0.textContent = gameState.health?.[0] ?? 30;
  if (h1) h1.textContent = gameState.health?.[1] ?? 30;
  
  if (turnEl) {
    turnEl.textContent = `Ход ${gameState.turn || 1} • Сейчас ходит игрок ${ (gameState.currentPlayer ?? 0) + 1 }`;
  }
  
  if (roleEl && myPlayerIndex !== null) {
    const isMyTurn = myPlayerIndex === gameState.currentPlayer;
    roleEl.innerHTML = `Вы: <b>Игрок ${myPlayerIndex + 1}</b> ${isMyTurn ? '<span style="color:#aaffaa">(ВАШ ХОД)</span>' : ''}`;
  }
}

function logGameAction(text) {
  const log = document.getElementById('game-log');
  if (!log) return;
  const time = new Date().toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
  log.innerHTML += `<div>[${time}] ${text}</div>`;
  log.scrollTop = log.scrollHeight;
}

function sendGameAction(type, extra = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    showToast("Нет соединения с сервером");
    return false;
  }
  if (!currentRoomId) {
    showToast("Вы не в матче");
    return false;
  }
  
  const payload = {
    type,
    roomId: currentRoomId,
    playerIndex: myPlayerIndex,
    ...extra
  };
  
  ws.send(JSON.stringify(payload));
  logGameAction(`Вы: ${type} ${extra.cardId ? extra.cardId : ''}`);
  return true;
}

// ==================== GAME ACTION BUTTONS (demo) ====================
function setupGameButtons() {
  const btnPlay = document.getElementById('btn-play-card');
  const btnEnd = document.getElementById('btn-end-turn');
  const btnAttack = document.getElementById('btn-attack');
  const btnSurr = document.getElementById('btn-surrender');
  const btnBackGame = document.getElementById('btn-back-to-menu-from-game');
  
  if (btnPlay) btnPlay.onclick = () => {
    // Demo: send playCard (in real game would open hand selection)
    const fakeCardId = currentDeckForGame?.cards?.[0]?.id || 'k1';
    sendGameAction('playCard', { cardId: fakeCardId, row: Math.random() > 0.5 ? 'left' : 'right' });
  };
  
  if (btnEnd) btnEnd.onclick = () => {
    if (sendGameAction('endTurn')) {
      // Optimistic local update for responsiveness
      if (gameState && myPlayerIndex === gameState.currentPlayer) {
        gameState.currentPlayer = 1 - myPlayerIndex;
        gameState.turn = (gameState.turn || 1) + 1;
        updateGameUI();
      }
    }
  };
  
  if (btnAttack) btnAttack.onclick = () => {
    sendGameAction('attack', { target: 'opponent', damage: 5 });
    // Optimistic
    if (gameState) {
      const opp = 1 - myPlayerIndex;
      gameState.health[opp] = Math.max(0, (gameState.health[opp] || 30) - 5);
      updateGameUI();
      if (gameState.health[opp] <= 0) {
        logGameAction("Противник повержен!");
      }
    }
  };
  
  if (btnSurr) btnSurr.onclick = () => {
    if (confirm("Вы уверены, что хотите сдаться?")) {
      sendGameAction('surrender');
      setTimeout(() => showMainMenu(), 600);
    }
  };
  
  if (btnBackGame) btnBackGame.onclick = () => {
    if (currentRoomId && ws) {
      if (confirm("Выйти из матча? (будет засчитано как поражение)")) {
        sendGameAction('surrender');
        setTimeout(() => showMainMenu(), 400);
      }
    } else {
      showMainMenu();
    }
    if (window.botInterval) {
      clearInterval(window.botInterval);
      window.botInterval = null;
    }
  };
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Bind main menu buttons
  const btnOnline = document.getElementById('btn-online');
  const btnMyDecks = document.getElementById('btn-my-decks');
  const btnBot = document.getElementById('btn-bot');
  
  if (btnOnline) btnOnline.onclick = startOnlineMatch;
  if (btnMyDecks) btnMyDecks.onclick = showMyDecks;
  if (btnBot) btnBot.onclick = () => {
    if (savedDecks && savedDecks.length > 0) {
      showMyDecks();
    } else {
      // If no decks, go to builder (deckbuilder.js handles it)
      if (typeof showDeckBuilder === 'function') {
        showDeckBuilder();
      } else {
        showToast("Сначала создайте колоду в редакторе");
      }
    }
  };
  
  // Back buttons (some are in deckbuilder.js too)
  const backDecks = document.getElementById('btn-back-from-decks');
  if (backDecks) backDecks.onclick = showMainMenu;
  
  const backMenu = document.getElementById('btn-back-to-menu');
  if (backMenu) backMenu.onclick = showMainMenu;
  
  // Game buttons
  setupGameButtons();
  
  // Show main menu
  showMainMenu();
  
  console.log('%c✅ Lily Wars fully loaded! Multiplayer ready.', 'color:#88ffaa');
});
