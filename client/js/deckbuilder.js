// ==================== DECK BUILDER ====================
let currentDeck = [];
let selectedFaction = 'knights';

function showDeckBuilder() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const builderScreen = document.getElementById('screen-deck-builder');
  if (builderScreen) builderScreen.classList.add('active');
  
  renderFactionSelect();
  renderAvailableCards();
  renderCurrentDeck();
}

function renderFactionSelect() {
  const container = document.getElementById('faction-select');
  if (!container) return;
  container.innerHTML = `
    <button onclick="selectFaction('knights')" class="btn" style="min-width:220px;">🛡️ Рыцари Лилии</button>
    <!-- Add more faction buttons here when ready -->
  `;
}

function selectFaction(faction) {
  selectedFaction = faction;
  renderAvailableCards();
}

function renderAvailableCards() {
  const container = document.getElementById('available-cards');
  if (!container) return;
  container.innerHTML = '<h3 style="margin-bottom:10px;">Доступные карты</h3>';
  
  const factionData = FACTIONS[selectedFaction];
  if (!factionData) return;
  
  factionData.cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div style="font-weight:bold; font-size:1.05em;">${card.name}</div>
      <div>⚔️ Сила: <b>${card.power}</b></div>
      <div>✨ Влияние: <b>${card.influence}</b></div>
      ${card.effect ? `<div class="effect">${card.effect}</div>` : ''}
    `;
    el.onclick = () => addCardToDeck(card);
    container.appendChild(el);
  });
}

function addCardToDeck(card) {
  if (currentDeck.length >= GAME_CONFIG.maxDeckSize) {
    window.showToast && window.showToast("Колода полная (макс. 25 карт)");
    return;
  }
  const totalInfluence = currentDeck.reduce((sum, c) => sum + (c.influence || 0), 0) + (card.influence || 0);
  if (totalInfluence > GAME_CONFIG.maxInfluence) {
    window.showToast && window.showToast("Превышен лимит влияния (170)!");
    return;
  }
  currentDeck.push({ ...card });
  renderCurrentDeck();
}

function renderCurrentDeck() {
  const countEl = document.getElementById('deck-count');
  const infEl = document.getElementById('influence-count');
  const cardsContainer = document.getElementById('deck-cards');
  
  if (!countEl || !infEl || !cardsContainer) return;
  
  const currentInf = currentDeck.reduce((sum, c) => sum + (c.influence || 0), 0);
  
  countEl.textContent = `${currentDeck.length}/${GAME_CONFIG.maxDeckSize}`;
  infEl.textContent = `${currentInf}/${GAME_CONFIG.maxInfluence}`;
  
  cardsContainer.innerHTML = '';
  
  if (currentDeck.length === 0) {
    cardsContainer.innerHTML = '<p style="padding:20px; opacity:0.6;">Добавляйте карты из списка слева →</p>';
    return;
  }
  
  currentDeck.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.minWidth = '125px';
    el.innerHTML = `
      <div>${card.name}</div>
      <small>С:${card.power} В:${card.influence}</small>
    `;
    el.onclick = () => removeCardFromDeck(i);
    cardsContainer.appendChild(el);
  });
}

function removeCardFromDeck(index) {
  currentDeck.splice(index, 1);
  renderCurrentDeck();
}

// Save deck handler
const saveBtn = document.getElementById('btn-save-deck');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    if (currentDeck.length === 0) {
      window.showToast && window.showToast("Колода пустая!");
      return;
    }
    
    const name = prompt("Название колоды:", `Моя колода #${(savedDecks?.length || 0) + 1}`);
    if (!name) return;
    
    const newDeck = {
      id: Date.now(),
      name: name.trim(),
      faction: selectedFaction,
      cards: [...currentDeck],
      leader: FACTIONS[selectedFaction]?.leader || null
    };
    
    savedDecks.push(newDeck);
    localStorage.setItem('lilyDecks', JSON.stringify(savedDecks));
    
    window.showToast && window.showToast("✅ Колода успешно сохранена!");
    
    // Go back to decks list
    if (typeof showMyDecks === 'function') {
      showMyDecks();
    } else {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('screen-my-decks')?.classList.add('active');
    }
  });
}

// Back button in builder
const backBtn = document.getElementById('btn-back-to-menu');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (typeof showMainMenu === 'function') {
      showMainMenu();
    } else {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('screen-main')?.classList.add('active');
    }
  });
}

// Make showDeckBuilder globally available (for game.js calls)
window.showDeckBuilder = showDeckBuilder;

console.log('%c✅ Deckbuilder loaded', 'color:#ffccaa');
