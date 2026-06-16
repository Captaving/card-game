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
  const faction = FACTIONS[selectedFaction];
  container.innerHTML = `<h3>Доступные карты <span style="color:${faction.color};">(${faction.name})</span></h3>`;
  
  faction.cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.borderColor = faction.color;
    
    const rowClass = card.row === 'left' ? 'row-left' : card.row === 'right' ? 'row-right' : 'row-any';
    const rowLabel = card.row === 'left' ? 'Левый' : card.row === 'right' ? 'Правый' : 'Любой';
    
    el.innerHTML = `
      <div style="font-weight:700; font-size:1.05em;">${card.name}</div>
      <div style="margin: 6px 0;">
        <strong>Сила:</strong> ${card.power} &nbsp; 
        <strong>Влияние:</strong> ${card.influence}
      </div>
      <div>
        <span class="row-indicator ${rowClass}">${rowLabel}</span>
        ${card.maxCopies ? `<span style="margin-left:8px; opacity:0.7;">×${card.maxCopies}</span>` : ''}
      </div>
      ${card.effect && card.effect !== 'Нет' && card.effect !== 'нет' ? 
        `<div class="effect">✦ ${card.effect}</div>` : ''}
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
  
  // Проверка максимального количества копий одной карты
  const maxCopies = card.maxCopies || 3;
  const currentCopies = currentDeck.filter(c => c.id === card.id).length;
  if (currentCopies >= maxCopies) {
    showToast(`Максимум ${maxCopies} копии(й) карты "${card.name}"`);
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
  const faction = FACTIONS[selectedFaction];
  
  currentDeck.forEach((card, i) => {
    const el = document.createElement('div');
    el.className = 'card';
    el.style.borderColor = faction.color;
    
    const rowClass = card.row === 'left' ? 'row-left' : card.row === 'right' ? 'row-right' : 'row-any';
    const rowLabel = card.row === 'left' ? 'Л' : card.row === 'right' ? 'П' : 'Л';
    
    el.innerHTML = `
      <div style="font-weight:600;">${card.name}</div>
      <div style="font-size:0.85em; opacity:0.85;">
        С:${card.power} В:${card.influence}
        <span class="row-indicator ${rowClass}" style="padding:1px 6px; font-size:0.7em;">${rowLabel}</span>
      </div>
    `;
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