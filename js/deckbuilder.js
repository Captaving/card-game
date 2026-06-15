let currentDeck = [];
let selectedFaction = 'knights';

function showDeckBuilder() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-deck-builder').classList.add('active');
  renderFactionSelect();
  renderAvailableCards();
  renderCurrentDeck();
}

function renderFactionSelect() {
  const container = document.getElementById('faction-select');
  container.innerHTML = `
    <button onclick="selectFaction('knights')" class="btn">Рыцари Лилии</button>
  `;
}

function selectFaction(faction) {
  selectedFaction = faction;
  renderAvailableCards();
}

function renderAvailableCards() {
  const container = document.getElementById('available-cards');
  container.innerHTML = '<h3>Доступные карты</h3>';
  
  FACTIONS[selectedFaction].cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <div>${card.name}</div>
      <div>Сила: ${card.power}</div>
      <div>Влияние: ${card.influence}</div>
      ${card.effect ? `<div class="effect">Эффект: ${card.effect}</div>` : ''}
    `;
    el.onclick = () => addCardToDeck(card);
    container.appendChild(el);
  });
}

function addCardToDeck(card) {
  if (currentDeck.length >= GAME_CONFIG.maxDeckSize) {
    showToast("Колода полная (25 карт)");
    return;
  }
  const totalInfluence = currentDeck.reduce((sum, c) => sum + c.influence, 0) + card.influence;
  if (totalInfluence > GAME_CONFIG.maxInfluence) {
    showToast("Превышен лимит влияния!");
    return;
  }
  currentDeck.push(card);
  renderCurrentDeck();
}

function renderCurrentDeck() {
  const countEl = document.getElementById('deck-count');
  const infEl = document.getElementById('influence-count');
  const cardsContainer = document.getElementById('deck-cards');

  countEl.textContent = `${currentDeck.length}/${GAME_CONFIG.maxDeckSize}`;
  infEl.textContent = `${currentDeck.reduce((sum, c) => sum + c.influence, 0)}/${GAME_CONFIG.maxInfluence}`;

  cardsContainer.innerHTML = '';
  currentDeck.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = card.name;
    el.onclick = () => removeCardFromDeck(i);
    cardsContainer.appendChild(el);
  });
}

function removeCardFromDeck(index) {
  currentDeck.splice(index, 1);
  renderCurrentDeck();
}

document.getElementById('btn-save-deck').addEventListener('click', () => {
  const name = prompt("Название колоды:", "Моя колода #" + (savedDecks.length + 1));
  if (!name) return;
  
  savedDecks.push({
    id: Date.now(),
    name: name,
    faction: selectedFaction,
    cards: [...currentDeck],
    leader: FACTIONS[selectedFaction].leader
  });
  
  localStorage.setItem('lilyDecks', JSON.stringify(savedDecks));
  showToast("Колода сохранена!");
  showMyDecks();
});

// Back buttons
document.getElementById('btn-back-to-menu').addEventListener('click', showMainMenu);