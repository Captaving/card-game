// Lily Wars - Main Game Logic + Screens
let currentDeckForGame = null;
let savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];
let selectedFactionForGame = null;
let selectedLeaderForGame = null;

// Lore placeholders
const FACTION_LORE = {
    knights: "Рыцари Цветка Лилии — благородный орден защитников королевства. Они верны королю и Лилии, сражаются с честью и дисциплиной. Их щиты и мечи защищают земли от тьмы.",
    blacklily: "Прислужники Черной Лилии — тёмный культ, поклоняющийся древней силе чёрной лилии. Они призывают нежить, демонов и проклятых воинов. Их цель — погрузить мир в вечную тьму.",
    dryads: "Дриады Леса Нидолион — древние хранители природы и магии леса. Они могут перемещать отряды, исцелять землю и призывать силу деревьев и духов. Защищают баланс мира.",
    wizards: "Орден Чародеев — могущественные маги, изучающие все школы магии. Они используют эликсиры, заклинания и артефакты. Их сила в знании и контроле над реальностью."
};

// Game state for bot match
let botGameState = {
    playerDeck: [],
    playerHand: [],
    playerLeft: [],
    playerRight: [],
    botDeck: [],
    botHand: [],
    botLeft: [],
    botRight: [],
    turn: 1,
    playerScore: 0,
    botScore: 0
};

function showMainMenu() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-main').classList.add('active');
}

function showMyDecks() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-my-decks').classList.add('active');
    renderDecksList();
}

// ==================== FACTION + LEADER SELECTION ====================
function showFactionSelectForGame() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Create temporary faction select screen if not exists
    let factionScreen = document.getElementById('screen-faction-select');
    if (!factionScreen) {
        factionScreen = document.createElement('div');
        factionScreen.id = 'screen-faction-select';
        factionScreen.className = 'screen active';
        factionScreen.innerHTML = `
            <h2 style="margin-bottom:20px;">Выберите фракцию</h2>
            <div id="faction-logos" class="faction-select" style="justify-content:center; gap:30px;"></div>
            <p style="margin-top:30px; color:#aaa;">Нажмите на эмблему фракции, чтобы узнать её историю</p>
            <button onclick="showMainMenu()" style="margin-top:20px;">← Назад</button>
        `;
        document.body.appendChild(factionScreen);
    } else {
        factionScreen.classList.add('active');
    }
    
    const container = document.getElementById('faction-logos');
    container.innerHTML = '';
    
    Object.keys(FACTIONS).forEach(key => {
        const f = FACTIONS[key];
        const btn = document.createElement('div');
        btn.className = 'faction-btn';
        btn.style.backgroundImage = `url('${f.emblem}')`;
        btn.style.width = '200px';
        btn.style.height = '200px';
        btn.innerHTML = `<span style="font-size:1.1em;">${f.name}</span>`;
        
        btn.onclick = () => showFactionLoreModal(key);
        container.appendChild(btn);
    });
}

function showFactionLoreModal(factionId) {
    const f = FACTIONS[factionId];
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:520px;">
            <h2 style="color:#ffccff; margin-bottom:15px;">${f.name}</h2>
            <div style="text-align:left; line-height:1.6; color:#e1bee7; margin-bottom:25px;">
                ${FACTION_LORE[factionId] || "Лор этой фракции находится в процессе создания. Скоро здесь появится богатая история мира Lily Wars с интригами, легендами и глубоким лором!"}
            </div>
            <div style="display:flex; gap:15px; justify-content:center;">
                <button onclick="selectFactionAndContinue('${factionId}', this)">Выбрать фракцию и продолжить</button>
                <button onclick="this.closest('.modal').remove()" style="background:#555; border-color:#888;">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function selectFactionAndContinue(factionId, btnElement) {
    btnElement.closest('.modal').remove();
    selectedFactionForGame = factionId;
    
    // Now show leader selection
    showLeaderSelectModal(factionId);
}

function showLeaderSelectModal(factionId) {
    const leaders = getFactionLeaders(factionId);
    if (!leaders || leaders.length === 0) {
        // Fallback to old flow
        startBotGameWithFaction(factionId);
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    let html = `<div class="modal-content" style="max-width:600px;"><h2>Выберите Лидера</h2><div style="display:flex; flex-direction:column; gap:12px; margin:20px 0;">`;
    
    leaders.forEach(leader => {
        html += `
            <div onclick="selectLeader('${factionId}', '${leader.id}', this)" 
                 style="background:rgba(255,255,255,0.08); padding:16px; border-radius:12px; cursor:pointer; border:2px solid #7b5aa6; text-align:left;">
                <strong style="font-size:1.3em; color:#ffccff;">${leader.name}</strong><br>
                <span style="color:#b39ddb; font-size:0.95em;">Сила: ${leader.power} • Влияние: ${leader.influence}</span><br>
                <span style="color:#e1bee7; font-size:0.9em; margin-top:6px; display:block;">${leader.effect}</span>
            </div>
        `;
    });
    
    html += `</div><button onclick="this.closest('.modal').remove()" style="background:#555; border-color:#888;">Отмена</button></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

function selectLeader(factionId, leaderId, element) {
    element.closest('.modal').remove();
    selectedLeaderForGame = getFactionLeader(factionId, leaderId);
    
    showToast(`Лидер выбран: ${selectedLeaderForGame.name}`);
    
    // Now go to My Decks filtered by faction or start game
    // For simplicity, go to My Decks (user can choose deck of this faction)
    showMyDecks();
}

function renderDecksList() {
    const container = document.getElementById('decks-list');
    container.innerHTML = '<h3 style="margin-bottom:15px;">Ваши колоды</h3>';
    
    if (savedDecks.length === 0) {
        container.innerHTML += `
            <p style="color:#aaa; margin:30px 0;">У вас пока нет сохранённых колод.<br>Создайте первую в редакторе колод!</p>
            <button onclick="showDeckBuilder()">🛠️ Создать колоду</button>
        `;
        return;
    }

    savedDecks.forEach((deck, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background:rgba(255,255,255,0.08); margin:12px auto; padding:16px; border-radius:14px; max-width:420px; cursor:pointer; border:2px solid #7b5aa6;';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="font-size:1.25em; color:#ffccff;">${deck.name}</strong><br>
                    <span style="color:#b39ddb;">${deck.factionName || deck.faction}</span> — ${deck.cards.length} карт<br>
                    <small style="color:#888;">Влияние: ${deck.cards.reduce((s,c)=>s+c.influence,0)} / 170</small>
                </div>
                <div>
                    <button onclick="event.stopImmediatePropagation(); selectDeckForGame(${index});" style="padding:8px 16px; font-size:0.95em; min-width:auto;">Играть</button>
                    <button onclick="event.stopImmediatePropagation(); deleteDeck(${index});" style="padding:8px 12px; font-size:0.9em; background:#c62828; border-color:#ef5350; min-width:auto;">✕</button>
                </div>
            </div>
        `;
        div.onclick = () => selectDeckForGame(index);
        container.appendChild(div);
    });
}

function deleteDeck(index) {
    if (!confirm('Удалить эту колоду?')) return;
    savedDecks.splice(index, 1);
    localStorage.setItem('lilyDecks', JSON.stringify(savedDecks));
    renderDecksList();
}

function selectDeckForGame(deckIndex) {
    currentDeckForGame = savedDecks[deckIndex];
    showToast(`Колода "${currentDeckForGame.name}" выбрана!`);
    startBotGame();
}

function showDeckBuilderFromMenu() {
    showDeckBuilder();
}

// ==================== BOT GAME ====================
function startBotGame() {
    if (!currentDeckForGame || currentDeckForGame.cards.length < 10) {
        showToast("Выберите колоду с минимум 10 картами!");
        showMyDecks();
        return;
    }
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-game').classList.add('active');
    
    // Use selected faction/leader if available
    if (selectedFactionForGame && !currentDeckForGame.faction) {
        currentDeckForGame.faction = selectedFactionForGame;
    }
    
    // Initialize game state
    initBotGame();
}

function initBotGame() {
    const state = botGameState;
    
    // Player deck
    state.playerDeck = [...currentDeckForGame.cards];
    shuffleArray(state.playerDeck);
    
    // Bot uses same faction or random - for simplicity use same cards but different faction if possible
    const botFaction = Object.keys(FACTIONS).find(f => f !== currentDeckForGame.faction) || currentDeckForGame.faction;
    state.botDeck = [...FACTIONS[botFaction].cards];
    // Duplicate some to make 25
    while (state.botDeck.length < 25) {
        state.botDeck.push({...state.botDeck[Math.floor(Math.random()*state.botDeck.length)]});
    }
    shuffleArray(state.botDeck);
    
    // Draw starting hands - 10 cards
    state.playerHand = state.playerDeck.splice(0, 10);
    state.botHand = state.botDeck.splice(0, 10);
    state.currentPhase = 'mulligan';
    state.mulliganUsed = 0;
    
    // Clear board
    state.playerLeft = [];
    state.playerRight = [];
    state.botLeft = [];
    state.botRight = [];
    state.turn = 1;
    state.playerScore = 0;
    state.botScore = 0;
    
    renderGameBoard();
    showToast("Игра началась! Вы vs Бот. Играйте карты и заканчивайте ход.");
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderGameBoard() {
    const container = document.getElementById('game-board');
    if (!container) return;
    
    const state = botGameState;
    
    container.innerHTML = `
        <div style="text-align:center; margin-bottom:10px;">
            <h2 style="margin:0;">Ход ${state.turn} • Вы vs Бот</h2>
            <div style="display:flex; justify-content:center; gap:40px; margin:8px 0;">
                <div>Ваш счёт: <strong style="color:#4caf50;">${state.playerScore}</strong></div>
                <div>Бот: <strong style="color:#ef5350;">${state.botScore}</strong></div>
            </div>
        </div>
        
        <div class="lanes">
            <!-- Left Lane -->
            <div class="lane left">
                <h4>⬅️ ЛЕВЫЙ ФЛАНГ</h4>
                <div class="cards" id="player-left"></div>
                <div style="margin-top:8px; font-size:0.85em; color:#90caf9;">Бот</div>
                <div class="cards" id="bot-left"></div>
            </div>
            
            <!-- Right Lane -->
            <div class="lane right">
                <h4>ПРАВЫЙ ФЛАНГ ➡️</h4>
                <div class="cards" id="player-right"></div>
                <div style="margin-top:8px; font-size:0.85em; color:#ef9a9a;">Бот</div>
                <div class="cards" id="bot-right"></div>
            </div>
        </div>
        
        <div class="hand">
            <h4>Ваша рука (${state.playerHand.length} карт)</h4>
            <div class="cards" id="player-hand"></div>
        </div>
        
        <div style="text-align:center; margin-top:15px;">
            <button onclick="endPlayerTurn()" style="background:#2e7d32; border-color:#66bb6a; padding:14px 40px;">Закончить ход →</button>
            <button onclick="surrenderGame()" style="background:#c62828; border-color:#ef5350; padding:10px 24px; font-size:0.95em;">Сдаться</button>
        </div>
    `;
    
    // Render player hand
    const handContainer = document.getElementById('player-hand');
    state.playerHand.forEach((card, idx) => {
        const el = createCardElement(card, false);
        el.onclick = () => playCardFromHand(idx);
        handContainer.appendChild(el);
    });
    
    // Render player lanes
    renderLaneCards('player-left', state.playerLeft);
    renderLaneCards('player-right', state.playerRight);
    
    // Render bot lanes (face down or simple)
    renderLaneCards('bot-left', state.botLeft, true);
    renderLaneCards('bot-right', state.botRight, true);
}

function renderLaneCards(containerId, cards, isBot = false) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '';
    
    cards.forEach((card, i) => {
        const el = createCardElement(card, false);
        if (isBot) {
            el.style.filter = 'brightness(0.6) saturate(0.7)';
            el.onclick = null;
            el.style.cursor = 'default';
        }
        cont.appendChild(el);
    });
    
    if (cards.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#666; font-size:0.85em; padding:20px 0; text-align:center; width:100%;';
        empty.textContent = isBot ? 'Бот ещё не играл сюда' : 'Пусто';
        cont.appendChild(empty);
    }
}

function playCardFromHand(handIndex) {
    const state = botGameState;
    const card = state.playerHand[handIndex];
    
    // Determine allowed lanes
    let allowedLanes = [];
    if (card.line === 'left') allowedLanes = ['left'];
    else if (card.line === 'right') allowedLanes = ['right'];
    else allowedLanes = ['left', 'right'];
    
    // Ask player which lane
    const lane = prompt(`Куда поставить "${card.name}"? (left / right)`);
    if (!lane || !allowedLanes.includes(lane.toLowerCase())) {
        showToast("Неверный выбор ряда или карта не может быть там размещена.");
        return;
    }
    
    const targetLane = lane.toLowerCase() === 'left' ? 'playerLeft' : 'playerRight';
    
    // Play the card
    state[targetLane].push(card);
    state.playerHand.splice(handIndex, 1);
    
    // Real effect application
    applyCardEffect(card, 'player', targetLane);
    
    showToast(`Вы сыграли ${card.name} на ${lane} фланг`);
    renderGameBoard();
}

function applyCardEffect(card, side = 'player', laneKey = '') {
    const state = botGameState;
    const effectText = (card.effect || '').toLowerCase();
    const isPlayer = side === 'player';
    
    // Get opponent and own arrays
    const ownLeft = isPlayer ? state.playerLeft : state.botLeft;
    const ownRight = isPlayer ? state.playerRight : state.botRight;
    const oppLeft = isPlayer ? state.botLeft : state.playerLeft;
    const oppRight = isPlayer ? state.botRight : state.playerRight;
    
    const ownLane = laneKey.includes('Left') ? ownLeft : ownRight;
    const oppLane = laneKey.includes('Left') ? oppLeft : oppRight;
    
    let didSomething = false;
    
    // === DAMAGE EFFECTS ===
    if (effectText.includes('наносит') && (effectText.includes('урон') || effectText.includes('урона'))) {
        const dmgMatch = effectText.match(/(\d+)\s*урон/);
        const dmg = dmgMatch ? parseInt(dmgMatch[1]) : 1;
        
        // Pick random opponent card
        const allOpp = [...oppLeft, ...oppRight];
        if (allOpp.length > 0) {
            const target = allOpp[Math.floor(Math.random() * allOpp.length)];
            target.power = Math.max(0, (target.power || 0) - dmg);
            showToast(`${card.name} нанёс ${dmg} урона!`);
            didSomething = true;
        }
    }
    
    // === BUFF +X to own card ===
    if (effectText.includes('+') && effectText.includes('к силе') || effectText.includes('получает +')) {
        const buffMatch = effectText.match(/\+(\d+)/);
        const buff = buffMatch ? parseInt(buffMatch[1]) : 2;
        
        if (ownLane.length > 0) {
            const target = ownLane[Math.floor(Math.random() * ownLane.length)];
            target.power = (target.power || 0) + buff;
            showToast(`+${buff} к силе союзнику!`);
            didSomething = true;
        }
    }
    
    // === STEAL / ZABERITE card from opponent ===
    if (effectText.includes('заберете') || effectText.includes('забрать') || effectText.includes('заберете карту')) {
        const allOpp = [...oppLeft, ...oppRight];
        if (allOpp.length > 0) {
            const idx = Math.floor(Math.random() * allOpp.length);
            const stolen = allOpp.splice(idx, 1)[0];
            state.playerHand.push(stolen); // always to player hand for simplicity
            showToast(`${card.name}: Вы украли карту противника!`);
            didSomething = true;
        }
    }
    
    // === DRAW from deck ===
    if (effectText.includes('сыграйте верхнюю карту') || effectText.includes('возьмите карту из колоды')) {
        if (state.playerDeck.length > 0) {
            const drawn = state.playerDeck.shift();
            state.playerHand.push(drawn);
            showToast(`Вы взяли карту из колоды: ${drawn.name}`);
            didSomething = true;
        }
    }
    
    // === MOVE cards between lanes ===
    if (effectText.includes('перемещает') || effectText.includes('переместите')) {
        if (ownLane.length > 1) {
            const cardToMove = ownLane.pop();
            const otherLane = laneKey.includes('Left') ? ownRight : ownLeft;
            otherLane.push(cardToMove);
            showToast(`${card.name}: Карта перемещена в другой ряд!`);
            didSomething = true;
        }
    }
    
    // === SUMMON tokens (Демон, Падальщик, Призрак) ===
    if (effectText.includes('призывает') || effectText.includes('создаёт')) {
        let token = null;
        if (effectText.includes('демон')) {
            token = { id: 'token_demon', name: 'Демон', type: 'white', line: 'right', power: 4, influence: 4, maxCopies: 99, effect: 'Призванный демон' };
        } else if (effectText.includes('падальщик')) {
            token = { id: 'token_paddler', name: 'Падальщик', type: 'white', line: 'right', power: 2, influence: 2, maxCopies: 99, effect: 'Призванный падальщик' };
        } else if (effectText.includes('призрак')) {
            token = { id: 'token_ghost', name: 'Призрак', type: 'white', line: 'any', power: 1, influence: 2, maxCopies: 99, effect: 'Призванный призрак' };
        }
        
        if (token) {
            ownLane.push(token);
            showToast(`${card.name}: Призван ${token.name}!`);
            didSomething = true;
        }
    }
    
    // === Special cards that go to discard immediately ===
    if (card.type === 'special' || effectText.includes('уходит в отбой')) {
        // Remove from board after effect (already not added in some cases, but ensure)
        showToast(`${card.name} сработала и ушла в отбой.`);
        didSomething = true;
    }
    
    // === King / Leader repeat on-play effect (simplified) ===
    if (effectText.includes('активируют умения повторно') || effectText.includes('повторно')) {
        // Re-apply effects of other cards in lane (simplified)
        ownLane.forEach(c => {
            if (c.id !== card.id && c.effect) {
                applyCardEffect(c, side, laneKey);
            }
        });
        showToast('Эффекты размещения активированы повторно!');
        didSomething = true;
    }
    
    if (didSomething) {
        renderGameBoard();
    }
    
    return didSomething;
}

function endPlayerTurn() {
    const state = botGameState;
    
    // Bot plays 1-2 random cards
    botPlayTurn();
    
    // Resolve lanes
    resolveLanes();
    
    state.turn++;
    
    // Check win condition (simple: after 5 turns or one side has no cards left)
    if (state.turn > 6 || (state.playerHand.length === 0 && state.playerDeck.length === 0)) {
        endBotGame();
        return;
    }
    
    // Draw one card for player if deck not empty
    if (state.playerDeck.length > 0 && state.playerHand.length < 8) {
        state.playerHand.push(state.playerDeck.shift());
    }
    
    renderGameBoard();
    showToast(`Ход ${state.turn}. Бот сыграл свой ход.`);
}

function botPlayTurn() {
    const state = botGameState;
    
    // Bot plays up to 2 cards randomly to allowed lanes
    for (let i = 0; i < 2; i++) {
        if (state.botHand.length === 0) break;
        
        const idx = Math.floor(Math.random() * state.botHand.length);
        const card = state.botHand[idx];
        
        let lane = card.line === 'left' ? 'botLeft' : 
                   card.line === 'right' ? 'botRight' : 
                   (Math.random() > 0.5 ? 'botLeft' : 'botRight');
        
        state[lane].push(card);
        state.botHand.splice(idx, 1);
        
        applyCardEffect(card, 'bot', lane);
    }
}

function resolveLanes() {
    const state = botGameState;
    
    // Left lane
    const pLeftPower = state.playerLeft.reduce((s, c) => s + (c.power || 0), 0);
    const bLeftPower = state.botLeft.reduce((s, c) => s + (c.power || 0), 0);
    
    if (pLeftPower > bLeftPower) {
        state.playerScore += (pLeftPower - bLeftPower);
        showToast(`Левый фланг: Вы победили (+${pLeftPower - bLeftPower})`);
    } else if (bLeftPower > pLeftPower) {
        state.botScore += (bLeftPower - pLeftPower);
        showToast(`Левый фланг: Бот победил`);
    }
    
    // Right lane
    const pRightPower = state.playerRight.reduce((s, c) => s + (c.power || 0), 0);
    const bRightPower = state.botRight.reduce((s, c) => s + (c.power || 0), 0);
    
    if (pRightPower > bRightPower) {
        state.playerScore += (pRightPower - bRightPower);
        showToast(`Правый фланг: Вы победили (+${pRightPower - bRightPower})`);
    } else if (bRightPower > pRightPower) {
        state.botScore += (bRightPower - pRightPower);
    }
}

function endBotGame() {
    const state = botGameState;
    let result = '';
    
    if (state.playerScore > state.botScore) {
        result = `🏆 ПОБЕДА! Ваш счёт ${state.playerScore} : ${state.botScore}`;
    } else if (state.botScore > state.playerScore) {
        result = `😔 Поражение. Бот выиграл ${state.botScore} : ${state.playerScore}`;
    } else {
        result = `🤝 Ничья! ${state.playerScore} : ${state.botScore}`;
    }
    
    const container = document.getElementById('game-board');
    container.innerHTML = `
        <div style="text-align:center; padding:40px 20px;">
            <h1 style="font-size:2.8em; margin-bottom:20px;">${result}</h1>
            <p style="font-size:1.3em; margin-bottom:30px;">Спасибо за игру!</p>
            
            <button onclick="startBotGame()" style="margin:10px;">🔄 Играть ещё раз</button>
            <button onclick="showMainMenu()" style="margin:10px; background:#555; border-color:#888;">🏠 В главное меню</button>
        </div>
    `;
}

function surrenderGame() {
    if (confirm('Сдаться? Бот победит.')) {
        botGameState.playerScore = 0;
        botGameState.botScore = 999;
        endBotGame();
    }
}

// ==================== ONLINE (placeholder for now) ====================
function startOnlineMatch() {
    showToast("Онлайн-режим в разработке. Скоро будет доступен через WebSocket сервер!");
    // In full version: connect to server.js via WebSocket
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Telegram Mini App
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
    }
    
    // Button bindings
    const btnOnline = document.getElementById('btn-online');
    const btnMyDecks = document.getElementById('btn-my-decks');
    const btnBot = document.getElementById('btn-bot');
    const btnNewDeck = document.getElementById('btn-new-deck');
    const btnBackDecks = document.getElementById('btn-back-from-decks');
    const btnBackBuilder = document.getElementById('btn-back-to-menu');
    const btnSaveDeck = document.getElementById('btn-save-deck');
    
    if (btnOnline) btnOnline.onclick = startOnlineMatch;
    if (btnMyDecks) btnMyDecks.onclick = showMyDecks;
    if (btnBot) btnBot.onclick = () => {
        showFactionSelectForGame();
    };
    if (btnNewDeck) btnNewDeck.onclick = showDeckBuilderFromMenu;
    if (btnBackDecks) btnBackDecks.onclick = showMainMenu;
    if (btnBackBuilder) btnBackBuilder.onclick = showMainMenu;
    if (btnSaveDeck) btnSaveDeck.onclick = () => {
        if (typeof window.saveCurrentDeck === 'function') {
            window.saveCurrentDeck();
        }
    };
    
    // Toast helper
    window.showToast = function(msg) {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2600);
    };
    
    // Load saved decks
    savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];
    
    showMainMenu();
    renderMainFactionLogos();
    console.log("✅ Lily Wars fully initialized!");
});

function renderMainFactionLogos() {
    const container = document.getElementById('main-faction-logos');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(FACTIONS).forEach(key => {
        const f = FACTIONS[key];
        const btn = document.createElement('div');
        btn.className = 'faction-btn';
        btn.style.width = '160px';
        btn.style.height = '160px';
        btn.style.backgroundImage = `url('${f.emblem}')`;
        btn.innerHTML = `<span style="font-size:0.95em; padding:6px;">${f.name}</span>`;
        
        btn.onclick = () => showFactionLoreModal(key);
        container.appendChild(btn);
    });
}