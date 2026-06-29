// Deck Builder - Beautiful card-style UI with copy selection
let currentDeck = [];
let selectedFaction = 'knights';
let currentCardForModal = null;

function showDeckBuilder() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-deck-builder').classList.add('active');
    
    renderFactionSelect();
    renderAvailableCards();
    renderCurrentDeck();
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
            currentDeck = []; // reset deck when changing faction
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
    
    const lineText = card.line === 'left' ? 'Левый фланг' : 
                     card.line === 'right' ? 'Правый фланг' : 'Любой ряд';
    
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
        // Show how many copies already in deck
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
            btn.textContent = i;
            btn.onclick = () => addCopiesToDeck(card, i);
            options.appendChild(btn);
        }
    }
    
    modal.style.display = 'flex';
}

function addCopiesToDeck(card, count) {
    closeModal();
    
    const totalInfluence = currentDeck.reduce((sum, c) => sum + c.influence, 0);
    let added = 0;
    
    for (let i = 0; i < count; i++) {
        const newTotalInf = totalInfluence + (added + 1) * card.influence;
        if (currentDeck.length >= GAME_CONFIG.maxDeckSize) {
            showToast("Колода полна (25 карт)");
            break;
        }
        if (newTotalInf > GAME_CONFIG.maxInfluence) {
            showToast("Превышен лимит Влияния (170)!");
            break;
        }
        currentDeck.push({...card});
        added++;
    }
    
    if (added > 0) {
        showToast(`Добавлено ${added} × ${card.name}`);
    }
    
    renderAvailableCards();
    renderCurrentDeck();
}

function closeModal() {
    document.getElementById('copy-modal').style.display = 'none';
}

function renderCurrentDeck() {
    const countEl = document.getElementById('deck-count');
    const infEl = document.getElementById('influence-count');
    const cardsContainer = document.getElementById('deck-cards');
    
    const totalInf = currentDeck.reduce((sum, c) => sum + c.influence, 0);
    
    countEl.textContent = `${currentDeck.length} / ${GAME_CONFIG.maxDeckSize}`;
    infEl.textContent = `${totalInf} / ${GAME_CONFIG.maxInfluence}`;
    
    // Color the influence if close to limit
    infEl.style.color = totalInf > 150 ? '#ff8a80' : totalInf > 120 ? '#ffcc80' : '#fff';
    
    cardsContainer.innerHTML = '';
    
    if (currentDeck.length === 0) {
        const empty = document.createElement('p');
        empty.style.cssText = 'color:#aaa; padding:20px;';
        empty.textContent = 'Колода пуста. Нажмите на карты слева, чтобы добавить.';
        cardsContainer.appendChild(empty);
        return;
    }
    
    // Group by card id to show counts
    const grouped = {};
    currentDeck.forEach(card => {
        if (!grouped[card.id]) grouped[card.id] = { card, count: 0 };
        grouped[card.id].count++;
    });
    
    Object.values(grouped).forEach(({card, count}) => {
        const el = createCardElement(card, true);
        el.onclick = () => removeCardFromDeck(card.id);
        
        // Add count badge
        const countBadge = document.createElement('div');
        countBadge.style.cssText = 'position:absolute;top:4px;left:4px;background:#4caf50;color:white;font-size:0.75em;padding:1px 6px;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;';
        countBadge.textContent = count > 1 ? count : '';
        if (count > 1) el.appendChild(countBadge);
        
        cardsContainer.appendChild(el);
    });
}

function removeCardFromDeck(cardId) {
    // Remove one copy
    const index = currentDeck.findIndex(c => c.id === cardId);
    if (index !== -1) {
        currentDeck.splice(index, 1);
        showToast('Карта удалена');
        renderAvailableCards();
        renderCurrentDeck();
    }
}

function saveCurrentDeck() {
    if (currentDeck.length === 0) {
        showToast("Колода не может быть пустой!");
        return;
    }
    
    const name = prompt("Название колоды:", `${FACTIONS[selectedFaction].name} #${(savedDecks.length + 1)}`);
    if (!name) return;
    
    const deck = {
        id: Date.now(),
        name: name.trim(),
        faction: selectedFaction,
        factionName: FACTIONS[selectedFaction].name,
        cards: [...currentDeck],
        leader: getFactionLeader(selectedFaction),
        created: new Date().toISOString()
    };
    
    savedDecks.push(deck);
    localStorage.setItem('lilyDecks', JSON.stringify(savedDecks));
    
    showToast(`Колода "${name}" сохранена!`);
    
    // Go to my decks
    setTimeout(() => {
        showMyDecks();
    }, 800);
}

// Expose for other scripts
window.saveCurrentDeck = saveCurrentDeck;