// Deck Builder - Beautiful card-style UI with copy selection + leader pick
let currentDeck = [];
let selectedFaction = 'knights';
let selectedLeader = null;
let currentCardForModal = null;

function showDeckBuilder(editDeck = null) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-deck-builder').classList.add('active');

    if (editDeck) {
        currentDeck = [...editDeck.cards];
        selectedFaction = editDeck.faction;
        selectedLeader = editDeck.leader || getFactionLeader(editDeck.faction);
    } else {
        // Reset only if starting fresh
        selectedLeader = selectedLeader || getFactionLeader(selectedFaction);
    }

    renderFactionSelect();
    renderLeaderPanel();
    renderAvailableCards();
    renderCurrentDeck();
}

function renderFactionSelect() {
    const container = document.getElementById('faction-select');
    container.innerHTML = '<h3 style="width:100%; text-align:center; margin-bottom:15px; color:#f5e6c8;">Выберите фракцию</h3>';

    Object.keys(FACTIONS).forEach(key => {
        const f = FACTIONS[key];
        const btn = document.createElement('div');
        btn.className = `faction-btn ${selectedFaction === key ? 'active' : ''}`;
        btn.style.backgroundImage = `url('${f.emblem}')`;
        btn.innerHTML = `<span>${f.name}</span>`;

        btn.onclick = () => {
            selectedFaction = key;
            selectedLeader = getFactionLeader(key);
            currentDeck = [];
            renderFactionSelect();
            renderLeaderPanel();
            renderAvailableCards();
            renderCurrentDeck();
        };
        container.appendChild(btn);
    });
}

// ==================== LEADER PANEL ====================
function renderLeaderPanel() {
    let panel = document.getElementById('leader-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'leader-panel';
        // Insert after faction-select
        const factionDiv = document.getElementById('faction-select');
        factionDiv.parentNode.insertBefore(panel, factionDiv.nextSibling);
    }

    const leaders = getFactionLeaders(selectedFaction);
    const leader = selectedLeader || leaders[0];

    panel.innerHTML = `
        <div style="max-width:1100px; margin:15px auto; padding:14px 20px;
             background:rgba(20,10,5,0.55); border:2px solid rgba(255,220,140,0.35);
             border-radius:14px; display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
            <div style="flex:1; min-width:220px;">
                <div style="color:#f5d080; font-size:0.78em; margin-bottom:4px; letter-spacing:0.05em;">ЛИДЕР КОЛОДЫ</div>
                <div style="color:#fff; font-size:1.1em; font-weight:bold;">${leader ? leader.name : '—'}</div>
                ${leader ? `<div style="color:#d4c5a9; font-size:0.82em; margin-top:4px;">${leader.effect}</div>` : ''}
            </div>
            <button onclick="showLeaderPickModal()" style="min-width:auto; padding:10px 22px; font-size:0.9em;
                background:transparent; border:2px solid rgba(255,255,255,0.5); color:#fff;">
                ✏️ Сменить лидера
            </button>
        </div>
    `;
}

function showLeaderPickModal() {
    const leaders = getFactionLeaders(selectedFaction);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.id = 'leader-pick-modal';

    let html = `<div class="modal-content" style="max-width:560px; width:92%;">
        <h3 style="color:#ffccff; margin-bottom:16px;">Выберите лидера</h3>
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">`;

    leaders.forEach(leader => {
        const isSelected = selectedLeader && selectedLeader.id === leader.id;
        html += `
            <div onclick="pickLeader('${leader.id}')"
                 style="background:rgba(255,255,255,${isSelected ? '0.18' : '0.06'});
                        padding:14px 16px; border-radius:12px; cursor:pointer;
                        border:2px solid ${isSelected ? '#ffcc80' : '#7b5aa6'}; text-align:left;
                        transition:all 0.15s;">
                <strong style="font-size:1.1em; color:#ffccff;">${leader.name}</strong>
                <div style="color:#e1bee7; font-size:0.85em; margin-top:5px;">${leader.effect}</div>
            </div>`;
    });

    html += `</div>
        <button onclick="document.getElementById('leader-pick-modal').remove()"
            style="background:transparent; border:2px solid rgba(255,255,255,0.4); color:#fff; padding:10px 28px; min-width:auto;">
            Отмена
        </button>
    </div>`;

    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function pickLeader(leaderId) {
    const modal = document.getElementById('leader-pick-modal');
    if (modal) modal.remove();
    selectedLeader = getFactionLeader(selectedFaction, leaderId);
    renderLeaderPanel();
    showToast(`Лидер: ${selectedLeader.name}`);
}

// ==================== CARDS ====================
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

    const lineText = card.line === 'left' ? 'Ближний' :
                     card.line === 'right' ? 'Дальний' : 'Любой ряд';

    // Tooltip on hold
    let holdTimer = null;
    el.addEventListener('pointerdown', () => {
        holdTimer = setTimeout(() => showCardTooltip(card, el), 450);
    });
    el.addEventListener('pointerup', () => clearTimeout(holdTimer));
    el.addEventListener('pointerleave', () => clearTimeout(holdTimer));

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

function showCardTooltip(card, anchorEl) {
    // Remove existing
    document.querySelectorAll('.card-tooltip').forEach(t => t.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 'card-tooltip';

    const typeLabel = {white:'Обычная', gray:'Улучшенная', purple:'Редкая', gold:'Золотая', special:'Спецкарта'}[card.type] || card.type;
    const lineLabel = card.line === 'left' ? 'Ближний ряд' : card.line === 'right' ? 'Дальний ряд' : 'Любой ряд';

    tooltip.innerHTML = `
        <div style="font-weight:bold; font-size:1.05em; color:#ffccff; margin-bottom:8px;">${card.name}</div>
        <div style="color:#b39ddb; font-size:0.8em; margin-bottom:8px;">${lineLabel} • ${typeLabel} • Сила: ${card.power} • Влияние: ${card.influence}</div>
        ${card.effect && card.effect !== 'Нет эффекта' ? `
            <div style="background:rgba(255,255,255,0.06); border-radius:8px; padding:10px; border-left:3px solid #c77dff;">
                <div style="color:#ffd740; font-size:0.75em; font-weight:bold; margin-bottom:5px; letter-spacing:0.05em;">✨ ЭФФЕКТ</div>
                <div style="color:#e1bee7; font-size:0.88em; line-height:1.45;">${card.effect}</div>
            </div>
        ` : '<div style="color:#888; font-size:0.85em;">Нет эффекта</div>'}
        <div style="text-align:right; margin-top:10px; color:#666; font-size:0.75em;">Удержи ещё раз чтобы закрыть</div>
    `;

    tooltip.style.cssText = `
        position:fixed; z-index:500;
        background:rgba(22,10,40,0.97);
        border:2px solid #c77dff;
        border-radius:14px; padding:16px;
        max-width:280px; min-width:220px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.7);
        pointer-events:auto;
    `;

    // Position near anchor
    const rect = anchorEl.getBoundingClientRect();
    const left = Math.min(rect.right + 10, window.innerWidth - 300);
    const top = Math.max(10, Math.min(rect.top, window.innerHeight - 280));
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    tooltip.addEventListener('click', () => tooltip.remove());
    document.addEventListener('click', function handler(e) {
        if (!tooltip.contains(e.target) && e.target !== anchorEl) {
            tooltip.remove();
            document.removeEventListener('click', handler);
        }
    }, { once: false });

    document.body.appendChild(tooltip);
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
        if (currentDeck.length >= GAME_CONFIG.maxDeckSize) {
            showToast("Колода полна (25 карт)");
            break;
        }
        const newTotalInf = totalInfluence + (added + 1) * card.influence;
        if (newTotalInf > GAME_CONFIG.maxInfluence) {
            showToast("Превышен лимит Влияния (170)!");
            break;
        }
        currentDeck.push({...card});
        added++;
    }

    if (added > 0) showToast(`Добавлено ${added} × ${card.name}`);

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
    infEl.style.color = totalInf > 150 ? '#ff8a80' : totalInf > 120 ? '#ffcc80' : '#fff';

    cardsContainer.innerHTML = '';

    if (currentDeck.length === 0) {
        const empty = document.createElement('p');
        empty.style.cssText = 'color:#aaa; padding:20px;';
        empty.textContent = 'Колода пуста. Нажмите на карты, чтобы добавить.';
        cardsContainer.appendChild(empty);
        return;
    }

    const grouped = {};
    currentDeck.forEach(card => {
        if (!grouped[card.id]) grouped[card.id] = { card, count: 0 };
        grouped[card.id].count++;
    });

    Object.values(grouped).forEach(({card, count}) => {
        const el = createCardElement(card, true);
        el.onclick = () => removeCardFromDeck(card.id);

        if (count > 1) {
            const countBadge = document.createElement('div');
            countBadge.style.cssText = 'position:absolute;top:4px;left:4px;background:#4caf50;color:white;font-size:0.75em;padding:0;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:bold;';
            countBadge.textContent = count;
            el.appendChild(countBadge);
        }

        cardsContainer.appendChild(el);
    });
}

function removeCardFromDeck(cardId) {
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

    const leader = selectedLeader || getFactionLeader(selectedFaction);

    const deck = {
        id: Date.now(),
        name: name.trim(),
        faction: selectedFaction,
        factionName: FACTIONS[selectedFaction].name,
        cards: [...currentDeck],
        leader: leader,
        created: new Date().toISOString()
    };

    savedDecks.push(deck);
    localStorage.setItem('lilyDecks', JSON.stringify(savedDecks));

    showToast(`Колода "${name}" сохранена!`);

    setTimeout(() => {
        showMyDecks();
    }, 800);
}

window.saveCurrentDeck = saveCurrentDeck;
