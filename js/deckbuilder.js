// Deck Builder - Полная версия
let currentDeck = [];
let selectedFaction = 'knights';
let currentCardForModal = null;

function showDeckBuilder() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-deck-builder').classList.add('active');
    
    renderFactionSelect();
    renderAvailableCards();
    renderCurrentDeck();

    // Кнопка Назад
    addBackButton('screen-deck-builder', () => showMainMenu());
}

function addBackButton(screenId, callback) {
    const screen = document.getElementById(screenId);
    if (!screen) return;

    const oldBtn = screen.querySelector('.back-btn');
    if (oldBtn) oldBtn.remove();

    const btn = document.createElement('button');
    btn.className = 'back-btn';
    btn.textContent = '← Назад';
    btn.style.cssText = 'position:absolute; top:15px; left:15px; z-index:100; padding:8px 18px; background:#5d4037; border:2px solid #a1887f; border-radius:8px;';
    btn.onclick = callback;
    screen.appendChild(btn);
}

function renderFactionSelect() {
    const container = document.getElementById('faction-select');
    container.innerHTML = '<h3 style="width:100%; text-align:center; margin-bottom:15px;">Выберите фракцию</h3>';
    
    Object.keys(FACTIONS).forEach(key => {
        const f = FACTIONS[key];
        const btn = document.createElement('div');
        btn.className = `faction-btn ${selectedFaction === key ? 'active' : ''}`;
        btn.style.backgroundImage = `url('${f.emblem}')`;
        btn.innerHTML = `<span>${f.name}</span>`;
        
        btn.onclick = () => {
            selectedFaction = key;
            currentDeck = [];
            renderFactionSelect();
            renderAvailableCards();
            renderCurrentDeck();
        };
        container.appendChild(btn);
    });
}

function renderAvailableCards() {
    const container = document.getElementById('available-cards');
    container.innerHTML = '';
    
    const cards = getFactionCards(selectedFaction);
    
    cards.forEach(card => {
        const el = createCardElement(card, false);
        el.onclick = () => showCopyModal(card);
        container.appendChild(el);
    });
}

function createCardElement(card, inDeck = false) {
    const el = document.createElement('div');
    el.className = `card ${card.type} ${inDeck ? 'in-deck' : ''}`;
    
    const lineText = card.line === 'left' ? 'Ближний ряд' : 
                     card.line === 'right' ? 'Дальний ряд' : 'Любой ряд';
    
    el.innerHTML = `
        <div class="card-header">${card.name}</div>
        <div class="type-line">${lineText} • ${card.type.toUpperCase()}</div>
        <div class="stats">
            <span class="power">⚔️ ${card.power}</span>
            <span class="influence">✨ ${card.influence}</span>
        </div>
        <div class="effect">${card.effect || 'Нет эффекта'}</div>
        <div class="max-copies">×${card.maxCopies}</div>
    `;
    
    if (inDeck) {
        const count = currentDeck.filter(c => c.id === card.id).length;
        if (count > 0) {
            const badge = document.createElement('div');
            badge.style.cssText = 'position:absolute;bottom:4px;left:4px;background:#4caf50;color:white;font-size:0.7em;padding:1px 6px;border-radius:4px;';
            badge.textContent = `${count}/${card.maxCopies}`;
            el.appendChild(badge);
        }
    }
    
    return el;
}

function showCopyModal(card) {
    currentCardForModal = card;
    const modal = document.getElementById('copy-modal');
    const title = document.getElementById('modal-card-name');
    const options = document.getElementById('copy-options');
    
    title.textContent = card.name;
    options.innerHTML = '';
    
    const currentCount = currentDeck.filter(c => c.id === card.id).length;
    const maxPossible = Math.min(card.maxCopies - currentCount, GAME_CONFIG.maxDeckSize - currentDeck.length);
    
    if (maxPossible <= 0) {
        options.innerHTML = '<p style="color:#ff8a80;">Достигнут максимум копий или колода полна!</p>';
    } else {
        for (let i = 1; i <= maxPossible; i++) {
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = `${i} шт.`;
            btn.onclick = () => addCardToDeck(i);
            options.appendChild(btn);
        }
    }
    modal.style.display = 'flex';
}

function addCardToDeck(count) {
    const card = currentCardForModal;
    const currentCount = currentDeck.filter(c => c.id === card.id).length;

    if (currentCount + count > card.maxCopies) {
        alert('Превышено максимальное количество копий!');
        return;
    }
    if (currentDeck.length + count > GAME_CONFIG.maxDeckSize) {
        alert('Колода не может содержать больше 25 карт!');
        return;
    }

    const totalInfluence = currentDeck.reduce((sum, c) => sum + c.influence, 0);
    if (totalInfluence + (card.influence * count) > GAME_CONFIG.maxInfluence) {
        alert('Превышен лимит влияния (170)!');
        return;
    }

    for (let i = 0; i < count; i++) {
        currentDeck.push({...card});
    }

    closeModal();
    renderCurrentDeck();
    renderAvailableCards();
}

function closeModal() {
    document.getElementById('copy-modal').style.display = 'none';
}

function renderCurrentDeck() {
    const container = document.getElementById('current-deck');
    container.innerHTML = '';
    
    if (currentDeck.length === 0) {
        container.innerHTML = '<p style="color:#888; text-align:center; width:100%;">Колода пуста</p>';
        return;
    }
    
    currentDeck.forEach((card, index) => {
        const el = createCardElement(card, true);
        el.onclick = () => removeCardFromDeck(index);
        container.appendChild(el);
    });
    
    const totalInfluence = currentDeck.reduce((sum, c) => sum + c.influence, 0);
    const stats = document.createElement('div');
    stats.style.cssText = 'width:100%; text-align:center; margin-top:10px; color:#aaa;';
    stats.innerHTML = `Карт: <strong>${currentDeck.length}/25</strong> &nbsp;&nbsp; Влияние: <strong>${totalInfluence}/170</strong>`;
    container.appendChild(stats);
}

function removeCardFromDeck(index) {
    currentDeck.splice(index, 1);
    renderCurrentDeck();
    renderAvailableCards();
}

function saveDeck() {
    if (currentDeck.length === 0) {
        alert('Колода пуста!');
        return;
    }
    
    const deckName = prompt('Введите название колоды:', 'Моя колода');
    if (!deckName) return;
    
    const savedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
    
    savedDecks.push({
        id: Date.now(),
        name: deckName,
        faction: selectedFaction,
        cards: [...currentDeck]
    });
    
    localStorage.setItem('savedDecks', JSON.stringify(savedDecks));
    alert('Колода сохранена!');
    showMyDecks();
}
