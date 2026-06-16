// Main Game Logic
let currentDeckForGame = null;

function showMainMenu() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-main').classList.add('active');
}

function showMyDecks() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-my-decks').classList.add('active');
  renderDecksList();
}

function renderDecksList() {
  const container = document.getElementById('decks-list');
  container.innerHTML = '<h3>Сохранённые колоды</h3>';
  
  if (savedDecks.length === 0) {
    container.innerHTML += '<p>У вас пока нет колод</p>';
    return;
  }

  savedDecks.forEach((deck, index) => {
    const div = document.createElement('div');
    div.className = 'deck-item';
    div.innerHTML = `
      <strong>${deck.name}</strong><br>
      ${deck.faction} — ${deck.cards.length} карт
    `;
    div.onclick = () => selectDeckForGame(deck);
    container.appendChild(div);
  });
}

function selectDeckForGame(deck) {
  currentDeckForGame = deck;
  showToast(`Колода "${deck.name}" выбрана!`);
  startBotGame(); // or online
}

function startBotGame() {
  if (!currentDeckForGame) {
    showToast("Сначала выберите колоду!");
    showMyDecks();
    return;
  }
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-game').classList.add('active');
  
  showToast("🎴 Игра с ботом началась! Колода загружена.");
  console.log("Игра начата с колодой:", currentDeckForGame);
}

function startOnlineMatch() {
  showToast("Поиск соперника... (в разработке)");
}

// Button bindings
document.addEventListener('DOMContentLoaded', () => {
  if (window.Telegram?.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
  }

  document.getElementById('btn-online').addEventListener('click', startOnlineMatch);
  document.getElementById('btn-my-decks').addEventListener('click', showMyDecks);
  document.getElementById('btn-bot').addEventListener('click', () => {
    if (savedDecks.length > 0) {
      showMyDecks();
    } else {
      showDeckBuilder();
    }
  });

  document.getElementById('btn-new-deck').addEventListener('click', showDeckBuilder);
  document.getElementById('btn-back-from-decks').addEventListener('click', showMainMenu);

  window.showToast = (msg) => {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2500);
  };

  showMainMenu();
  console.log("✅ Lily Wars fully loaded!");
});