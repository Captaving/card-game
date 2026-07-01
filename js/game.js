// Lily Wars - Main Game Logic
let currentDeckForGame = null;
let savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];

// Timer variables
let turnTimer = null;
let timeLeft = 30;
let isMobileDevice = false;

const FACTION_LORE = {
    knights: "Рыцари Цветка Лилии — благородный орден защитников королевства. Они верны королю и Лилии, сражаются с честью и дисциплиной. Их щиты и мечи защищают земли от тьмы.",
    blacklily: "Прислужники Черной Лилии — тёмный культ, поклоняющийся древней силе чёрной лилии. Они призывают нежить, демонов и проклятых воинов. Их цель — погрузить мир в вечную тьму.",
    dryads: "Дриады Леса Нидолион — древние хранители природы и магии леса. Они могут перемещать отряды, исцелять землю и призывать силу деревьев и духов. Защищают баланс мира.",
    wizards: "Орден Чародеев — могущественные маги, изучающие все школы магии. Они используют эликсиры, заклинания и артефакты. Их сила в знании и контроле над реальностью."
};

// ==================== DEVICE DETECTION ====================
function detectDevice() {
    isMobileDevice = window.innerWidth <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
        document.body.classList.add('mobile-device');
        setupMobileInterface();
    } else {
        document.body.classList.remove('mobile-device');
    }
}

// ==================== GAME STATE ====================
function initGameState(playerDeckData) {
    const botFaction = Object.keys(FACTIONS).find(f => f !== playerDeckData.faction) || 'knights';
    let botCards = [...FACTIONS[botFaction].cards];
    while (botCards.length < 25) {
        botCards.push({...botCards[Math.floor(Math.random() * botCards.length)]});
    }
    
    G = {
        round: 1,
        playerSwords: 0,
        botSwords: 0,
        playerPassed: false,
        botPassed: false,
        playerHasPlayedThisTurn: false,
        leaderUsed: false,
        botLeaderUsed: false,
        phase: 'mulligan',
        mulliganCount: 0,
        maxMulligan: 3,
        playerDeckFull: [...playerDeckData.cards],
        playerDeck: [],
        playerHand: [],
        playerLeft: [],
        playerRight: [],
        playerDiscard: [],
        botDeck: botCards,
        botHand: [],
        botLeft: [],
        botRight: [],
        botDiscard: [],
        playerLeader: playerDeckData.leader || getFactionLeader(playerDeckData.faction),
        botLeader: getFactionLeader(botFaction),
        playerFaction: playerDeckData.faction,
        botFaction: botFaction,
        playerRoundScore: 0,
        botRoundScore: 0,
    };

    shuffleArray(G.playerDeckFull);
    G.playerDeck = [...G.playerDeckFull];
    shuffleArray(G.botDeck);

    G.playerHand = G.playerDeck.splice(0, 10);
    G.botHand = G.botDeck.splice(0, 10);
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ==================== TIMER ====================
function startTurnTimer() {
    clearInterval(turnTimer);
    timeLeft = 30;
    updateTimerDisplay();
    
    turnTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(turnTimer);
            autoPass();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('turn-timer');
    const timerValue = document.getElementById('timer-value');
    
    if (timerEl && timerValue) {
        timerEl.style.display = 'block';
        timerValue.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            timerEl.classList.add('urgent');
        } else {
            timerEl.classList.remove('urgent');
        }
    }
}

function hideTimer() {
    const timerEl = document.getElementById('turn-timer');
    if (timerEl) {
        timerEl.style.display = 'none';
    }
    clearInterval(turnTimer);
}

function autoPass() {
    if (!G.playerPassed) {
        playerPass();
        showToast('⏱️ Время вышло! Автоматический пас.');
    }
}

// ==================== MOBILE INTERFACE ====================
function setupMobileInterface() {
    const handBtn = document.getElementById('mobile-btn-hand');
    const leaderBtn = document.getElementById('mobile-btn-leader');
    const passBtn = document.getElementById('mobile-btn-pass');
    const surrenderBtn = document.getElementById('mobile-btn-surrender');
    const popupBtn = document.getElementById('hand-popup-btn');
    
    if (handBtn) handBtn.onclick = toggleHandPopup;
    if (leaderBtn) leaderBtn.onclick = () => {
        if (!G.leaderUsed && G.playerLeader) {
            showLeaderAbilityModal();
        } else {
            showToast('Умение уже использовано!');
        }
    };
    if (passBtn) passBtn.onclick = playerPass;
    if (surrenderBtn) surrenderBtn.onclick = surrenderGame;
    if (popupBtn) popupBtn.onclick = toggleHandPopup;
}

function toggleHandPopup() {
    const popup = document.getElementById('hand-popup');
    if (popup) {
        popup.classList.toggle('active');
        if (popup.classList.contains('active')) {
            renderMobileHand();
        }
    }
}

function renderMobileHand() {
    const container = document.getElementById('mobile-hand-cards');
    if (!container) return;
    
    container.innerHTML = '';
    G.playerHand.forEach((card, idx) => {
        const el = createCardElement(card, false);
        el.style.width = '70px';
        el.style.minHeight = '100px';
        el.style.fontSize = '0.65em';
        el.onclick = () => {
            toggleHandPopup();
            showLaneSelection(idx);
        };
        container.appendChild(el);
    });
}

// ==================== SCREENS ====================
function showMainMenu() {
    hideTimer();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-main').classList.add('active');
    detectDevice();
}

function showMyDecks() {
    hideTimer();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-my-decks').classList.add('active');
    renderDecksList();
}

function renderDecksList() {
    const container = document.getElementById('decks-list');
    container.innerHTML = '<h3 style="margin-bottom:15px;">Ваши колоды</h3>';
    
    if (savedDecks.length === 0) {
        container.innerHTML += `
            <p style="color:#aaa; margin:30px 0;">У вас пока нет сохранённых колод.</p>
            <button onclick="showDeckBuilder()">🛠️ Создать колоду</button>
        `;
        return;
    }

    savedDecks.forEach((deck, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background:rgba(255,255,255,0.08); margin:12px auto; padding:16px; border-radius:14px; max-width:460px; border:2px solid #7b5aa6;';
        const leaderName = deck.leader ? deck.leader.name : '—';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div>
                    <strong style="font-size:1.15em; color:#ffccff;">${deck.name}</strong><br>
                    <span style="color:#b39ddb;">${deck.factionName || deck.faction}</span> — ${deck.cards.length} карт<br>
                    <small style="color:#f5d080;">Лидер: ${leaderName}</small>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button onclick="event.stopPropagation(); editDeck(${index});" style="padding:8px 14px; font-size:0.88em; min-width:auto; background:transparent; border:2px solid rgba(255,255,255,0.4); color:#fff;">✏️</button>
                    <button onclick="event.stopPropagation(); selectDeckForGame(${index});" style="padding:8px 16px; font-size:0.9em; min-width:auto;">Играть</button>
                    <button onclick="event.stopPropagation(); deleteDeck(${index});" style="padding:8px 12px; font-size:0.9em; background:#c62828; border-color:#ef5350; min-width:auto;">✕</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function editDeck(index) {
    const deck = savedDecks[index];
    currentDeck = [...deck.cards];
    selectedFaction = deck.faction;
    selectedLeader = deck.leader || getFactionLeader(deck.faction);
    showDeckBuilder(deck);
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
    startMulliganPhase();
}

// ==================== FACTION / LORE SCREENS ====================
function showFactionLoreModal(factionId) {
    const f = FACTIONS[factionId];
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:520px;">
            <h2 style="color:#ffccff; margin-bottom:15px;">${f.name}</h2>
            <div style="text-align:left; line-height:1.6; color:#e1bee7; margin-bottom:25px;">
                ${FACTION_LORE[factionId] || "Лор в разработке."}
            </div>
            <button onclick="this.closest('.modal').remove()" style="background:transparent; border:2px solid rgba(255,255,255,0.4); color:#fff; min-width:auto; padding:10px 28px;">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== MULLIGAN ====================
function startMulliganPhase() {
    if (!currentDeckForGame || currentDeckForGame.cards.length < 10) {
        showToast("Нужно минимум 10 карт в колоде!");
        return;
    }
    
    initGameState(currentDeckForGame);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-game').classList.add('active');
    detectDevice();
    renderMulliganScreen();
}

function renderMulliganScreen() {
    const container = document.getElementById('game-board');
    const leader = G.playerLeader;
    
    let html = `
        <div style="max-width:900px; margin:0 auto; padding:20px;">
            <h2 style="text-align:center; color:#d4af37; margin-bottom:6px;">Подготовка к игре</h2>
            <p style="text-align:center; color:#b39ddb; margin-bottom:20px;">
                Можно заменить до 3 карт (по одной за замену). Заменено: ${G.mulliganCount}/3
            </p>

            ${leader ? `
                <div style="background:rgba(180,100,255,0.1); border:2px solid rgba(200,150,255,0.4); border-radius:14px;
                            padding:14px 20px; margin-bottom:20px; max-width:600px; margin-left:auto; margin-right:auto;">
                    <div style="color:#ffd740; font-size:0.8em; margin-bottom:4px;">ВАШИ ЛИДЕР</div>
                    <div style="color:#fff; font-weight:bold; font-size:1.1em;">${leader.name}</div>
                    <div style="color:#d4c5a9; font-size:0.85em; margin-top:4px;">${leader.effect}</div>
                </div>
            ` : ''}

            <h3 style="text-align:center; color:#e0c080; margin-bottom:15px;">Ваша стартовая рука (нажмите на карту, чтобы заменить)</h3>
            <div id="mulligan-hand" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:30px;"></div>

            <div style="text-align:center;">
                <button onclick="startRound()" style="padding:16px 50px; font-size:1.15em;
                    background:transparent; border:2px solid rgba(255,255,255,0.5); color:#fff;">
                    ⚔️ Начать игру
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
    renderMulliganHand();
}

function renderMulliganHand() {
    const container = document.getElementById('mulligan-hand');
    if (!container) return;
    
    container.innerHTML = '';
    G.playerHand.forEach((card, idx) => {
        const el = createCardElement(card, false);
        el.style.cursor = G.mulliganCount < G.maxMulligan ? 'pointer' : 'default';
        if (G.mulliganCount < G.maxMulligan) {
            el.title = 'Нажмите для замены';
            el.onclick = () => mulliganSwap(idx);
            el.style.border = '2px dashed #ffcc80';
        }
        container.appendChild(el);
    });
}

function mulliganSwap(idx) {
    if (G.mulliganCount >= G.maxMulligan) return;
    if (G.playerDeck.length === 0) {
        showToast("Нет карт в колоде для замены!");
        return;
    }
    
    const removed = G.playerHand.splice(idx, 1)[0];
    G.playerDeck.push(removed);
    shuffleArray(G.playerDeck);
    
    const newCard = G.playerDeck.shift();
    G.playerHand.splice(idx, 0, newCard);
    G.mulliganCount++;

    showToast(`${removed.name} возвращена. Взята новая карта. (${G.mulliganCount}/3)`);
    renderMulliganScreen();
}

// ==================== ROUND START ====================
function startRound() {
    G.phase = 'play';
    G.playerPassed = false;
    G.botPassed = false;
    G.playerHasPlayedThisTurn = false;
    
    G.playerLeft = [];
    G.playerRight = [];
    G.botLeft = [];
    G.botRight = [];
    G.playerRoundScore = 0;
    G.botRoundScore = 0;

    renderGameBoard();
    showToast(`Раунд ${G.round} начался!`);
    startTurnTimer();
}

// ==================== GAME BOARD RENDER ====================
function renderGameBoard() {
    const container = document.getElementById('game-board');
    if (!container) return;
    
    const pScore = calcScore('player');
    const bScore = calcScore('bot');
    const leader = G.playerLeader;

    const playerPassedBadge = G.playerPassed ? '<span style="color:#ff8a80; margin-left:8px;">ПАСС</span>' : '';
    const botPassedBadge = G.botPassed ? '<span style="color:#ff8a80; margin-left:8px;">ПАСС</span>' : '';

    // Update mobile header
    if (isMobileDevice) {
        document.getElementById('mobile-round').textContent = G.round;
        document.getElementById('mobile-player-swords').textContent = G.playerSwords;
        document.getElementById('mobile-bot-swords').textContent = G.botSwords;
        document.getElementById('mobile-player-points').textContent = pScore;
        document.getElementById('mobile-bot-points').textContent = bScore;
        document.querySelector('.game-header-mobile').style.display = 'block';
    }

    container.innerHTML = `
        <div style="max-width:1100px; margin:0 auto;">
            <!-- HEADER (Desktop) -->
            <div class="desktop-header" style="text-align:center; padding:10px 0 6px; position:relative;">
                <h2 style="margin:0; color:#d4af37; font-size:1.3em;">Раунд ${G.round} / 3</h2>
                <div style="display:flex; justify-content:center; gap:30px; margin-top:6px; font-size:1em;">
                    <span>🗡️ Мечи игрока: <strong style="color:#4caf50;">${G.playerSwords}</strong></span>
                    <span>🗡️ Мечи бота: <strong style="color:#ef5350;">${G.botSwords}</strong></span>
                </div>
                <div style="display:flex; justify-content:center; gap:30px; margin-top:4px; font-size:0.9em; color:#aaa;">
                    <span>Ваши очки: <strong style="color:#80cbc4;">${pScore}</strong></span>
                    <span>Очки бота: <strong style="color:#ef9a9a;">${bScore}</strong></span>
                </div>
            </div>

            <!-- BOT AREA -->
            <div style="margin:10px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:0 4px;">
                    <div style="color:#ef9a9a; font-weight:bold; font-size:0.95em;">БОТ (${G.botFaction})${botPassedBadge}</div>
                    <div style="color:#888; font-size:0.82em;">Рука: ${G.botHand.length} | Колода: ${G.botDeck.length}</div>
                </div>
                <div class="lanes">
                    <div class="lane left">
                        <h4 style="font-size:0.9em; color:#90caf9;">Ближний ряд</h4>
                        <div class="cards" id="bot-left"></div>
                        <div style="text-align:right; font-size:0.8em; color:#90caf9; margin-top:4px;">Сила: ${G.botLeft.reduce((s,c)=>s+(c.power||0),0)}</div>
                    </div>
                    <div class="lane right">
                        <h4 style="font-size:0.9em; color:#ef9a9a;">Дальний ряд</h4>
                        <div class="cards" id="bot-right"></div>
                        <div style="text-align:right; font-size:0.8em; color:#ef9a9a; margin-top:4px;">Сила: ${G.botRight.reduce((s,c)=>s+(c.power||0),0)}</div>
                    </div>
                </div>
            </div>

            <div style="height:2px; background:linear-gradient(to right, transparent, #8b5a2b, transparent); margin:10px 0;"></div>

            <!-- PLAYER AREA -->
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding:0 4px;">
                    <div style="color:#64b5f6; font-weight:bold; font-size:0.95em;">ВЫ${playerPassedBadge}</div>
                    <div style="color:#888; font-size:0.82em;">Рука: ${G.playerHand.length} | Колода: ${G.playerDeck.length}</div>
                </div>
                <div class="lanes">
                    <div class="lane left">
                        <h4 style="font-size:0.9em; color:#64b5f6;">Ближний ряд</h4>
                        <div class="cards" id="player-left"></div>
                        <div style="text-align:right; font-size:0.8em; color:#64b5f6; margin-top:4px;">Сила: ${G.playerLeft.reduce((s,c)=>s+(c.power||0),0)}</div>
                    </div>
                    <div class="lane right">
                        <h4 style="font-size:0.9em; color:#ef9a9a;">Дальний ряд</h4>
                        <div class="cards" id="player-right"></div>
                        <div style="text-align:right; font-size:0.8em; color:#ef9a9a; margin-top:4px;">Сила: ${G.playerRight.reduce((s,c)=>s+(c.power||0),0)}</div>
                    </div>
                </div>
            </div>

            <!-- HAND (Desktop) -->
            <div class="hand desktop-hand" style="margin-top:14px; background:rgba(40,30,20,0.6); border:2px solid rgba(180,130,60,0.4);">
                <h4 style="color:#d4af37; margin-bottom:8px; font-size:0.95em;">Ваша рука (${G.playerHand.length})</h4>
                <div id="player-hand" style="display:flex; flex-wrap:wrap; gap:6px; min-height:160px;"></div>
            </div>

            <!-- ACTION BUTTONS (Desktop) -->
            <div class="desktop-turn-controls" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px; padding-bottom:20px;">
                ${!G.playerPassed ? `
                    <button onclick="playerEndTurn()" style="background:transparent; border:2px solid rgba(100,200,100,0.6); color:#fff; padding:12px 28px;">
                        ✅ Завершить ход
                    </button>
                    <button onclick="playerPass()" style="background:transparent; border:2px solid rgba(255,150,80,0.6); color:#fff; padding:12px 28px;">
                        🏳️ Пасс
                    </button>
                ` : '<div style="color:#ff8a80; padding:12px;">Вы пасанули — ждёте конца раунда</div>'}

                ${!G.leaderUsed && !G.playerPassed && leader ? `
                    <button onclick="showLeaderAbilityModal()" style="background:transparent; border:2px solid rgba(255,215,0,0.6); color:#ffd740; padding:12px 28px;">
                        👑 Умение лидера
                    </button>
                ` : ''}

                <button onclick="surrenderGame()" style="background:transparent; border:2px solid rgba(200,50,50,0.5); color:#ef9a9a; padding:12px 20px; font-size:0.9em;">
                    🏳 Сдаться
                </button>
            </div>
        </div>
    `;

    renderPlayerHand();
    renderLaneCards('player-left', G.playerLeft, false);
    renderLaneCards('player-right', G.playerRight, false);
    renderLaneCards('bot-left', G.botLeft, true);
    renderLaneCards('bot-right', G.botRight, true);
}

function calcScore(side) {
    if (side === 'player') {
        return [...G.playerLeft, ...G.playerRight].reduce((s, c) => s + (c.power || 0), 0);
    }
    return [...G.botLeft, ...G.botRight].reduce((s, c) => s + (c.power || 0), 0);
}

function renderPlayerHand() {
    const container = document.getElementById('player-hand');
    if (!container) return;
    
    container.innerHTML = '';
    G.playerHand.forEach((card, idx) => {
        const el = createCardElement(card, false);
        el.style.borderColor = G.playerPassed ? '#555' : '#42a5f5';
        if (!G.playerPassed) {
            el.onclick = () => showLaneSelection(idx);
        } else {
            el.style.opacity = '0.5';
            el.style.cursor = 'default';
        }
        container.appendChild(el);
    });
}

function renderLaneCards(containerId, cards, isBot = false) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    
    cont.innerHTML = '';
    cards.forEach(card => {
        const el = createCardElement(card, false);
        if (isBot) {
            el.style.filter = 'brightness(0.65) saturate(0.8)';
            el.style.cursor = 'default';
            el.onclick = null;
        }
        cont.appendChild(el);
    });

    if (cards.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#555; font-size:0.8em; padding:15px 0; text-align:center; width:100%;';
        empty.textContent = isBot ? '—' : 'Пусто';
        cont.appendChild(empty);
    }
}

// ==================== LANE SELECTION ====================
function showLaneSelection(handIdx) {
    if (G.playerHasPlayedThisTurn) {
        showToast("За ход можно выложить только 1 карту!");
        return;
    }
    
    const card = G.playerHand[handIdx];
    let allowed = [];
    
    if (card.line === 'left') allowed = ['left'];
    else if (card.line === 'right') allowed = ['right'];
    else allowed = ['left', 'right'];

    if (allowed.length === 1) {
        playCardToLane(handIdx, allowed[0]);
        return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;z-index:400;';
    overlay.innerHTML = `
        <div style="background:#2c2118; padding:28px; border-radius:16px; border:3px solid #8b5a2b; text-align:center; max-width:380px; width:90%;">
            <h3 style="color:#d4af37; margin-bottom:20px;">Куда поставить «${card.name}»?</h3>
            <div style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap;">
                <button onclick="playCardToLane(${handIdx},'left'); document.getElementById('lane-overlay')?.remove();"
                    style="padding:16px 32px; font-size:1.05em; background:transparent; border:2px solid rgba(100,180,255,0.7); color:#fff;">
                    🛡️ Ближний ряд
                </button>
                <button onclick="playCardToLane(${handIdx},'right'); document.getElementById('lane-overlay')?.remove();"
                    style="padding:16px 32px; font-size:1.05em; background:transparent; border:2px solid rgba(255,100,100,0.7); color:#fff;">
                    🏹 Дальний ряд
                </button>
            </div>
            <button onclick="document.getElementById('lane-overlay')?.remove()"
                style="margin-top:20px; background:transparent; border:2px solid rgba(255,255,255,0.3); color:#aaa; padding:8px 24px; font-size:0.9em; min-width:auto;">
                Отмена
            </button>
        </div>
    `;
    overlay.id = 'lane-overlay';
    document.body.appendChild(overlay);
}

function playCardToLane(handIdx, lane) {
    document.getElementById('lane-overlay')?.remove();
    
    if (G.playerHasPlayedThisTurn) {
        showToast("За ход можно выложить только 1 карту!");
        return;
    }

    const card = G.playerHand[handIdx];
    const targetArr = lane === 'left' ? G.playerLeft : G.playerRight;
    targetArr.push(card);
    G.playerHand.splice(handIdx, 1);
    G.playerHasPlayedThisTurn = true;

    applyCardEffect(card, 'player', lane);
    showToast(`Сыграна «${card.name}» на ${lane === 'left' ? 'Ближний' : 'Дальний'} ряд`);
    renderGameBoard();
}

// ==================== LEADER ABILITY ====================
function showLeaderAbilityModal() {
    const leader = G.playerLeader;
    if (!leader) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'leader-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:440px;">
            <h3 style="color:#ffd740; margin-bottom:14px;">👑 ${leader.name}</h3>
            <div style="background:rgba(255,215,0,0.08); border:2px solid rgba(255,215,0,0.3); border-radius:12px; padding:14px; margin-bottom:20px;">
                <div style="color:#ffd740; font-size:0.78em; margin-bottom:6px; letter-spacing:0.05em;">УМЕНИЕ ЛИДЕРА</div>
                <div style="color:#e1bee7; line-height:1.5;">${leader.effect}</div>
            </div>
            <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                <button onclick="useLeaderAbility()" style="background:transparent; border:2px solid rgba(255,215,0,0.6); color:#ffd740; padding:12px 28px;">
                    ✨ Применить
                </button>
                <button onclick="document.getElementById('leader-modal')?.remove()"
                    style="background:transparent; border:2px solid rgba(255,255,255,0.3); color:#aaa; padding:12px 24px; min-width:auto;">
                    Отмена
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function useLeaderAbility() {
    document.getElementById('leader-modal')?.remove();
    
    if (G.leaderUsed) { 
        showToast("Умение лидера уже использовано!"); 
        return; 
    }
    
    G.leaderUsed = true;
    const leader = G.playerLeader;
    const effectText = (leader?.effect || '').toLowerCase();

    if (effectText.includes('+1 к силе') || effectText.includes('всем вашим картам')) {
        [...G.playerLeft, ...G.playerRight].forEach(c => c.power = (c.power || 0) + 1);
        showToast(`${leader.name}: +1 к силе всем картам!`);
    } else if (effectText.includes('верните') && effectText.includes('из отбоя')) {
        if (G.playerDiscard.length > 0) {
            const card = G.playerDiscard.pop();
            G.playerHand.push(card);
            showToast(`${leader.name}: ${card.name} возвращена из отбоя!`);
        } else {
            showToast("Отбой пуст!");
        }
    } else if (effectText.includes('призрак') || effectText.includes('создайте')) {
        const ghost = { id: 'leader_ghost', name: 'Призрак', type: 'white', line: 'any', power: 1, influence: 0, maxCopies: 99, effect: 'Призванный лидером.' };
        G.playerLeft.push(ghost);
        showToast(`${leader.name}: Призван Призрак!`);
    } else {
        showToast(`${leader.name}: умение активировано!`);
    }

    renderGameBoard();
}

// ==================== PLAYER TURN / PASS ====================
function playerEndTurn() {
    if (!G.playerHasPlayedThisTurn && G.playerHand.length > 0) {
        showToast("Вы не сыграли карту! Сыграйте или нажмите Пасс.");
        return;
    }
    
    G.playerHasPlayedThisTurn = false;
    clearInterval(turnTimer);
    afterPlayerTurn();
}

function playerPass() {
    G.playerPassed = true;
    clearInterval(turnTimer);
    showToast("Вы пасанули. Ждёте конца раунда.");
    afterPlayerTurn();
}

function afterPlayerTurn() {
    // Check if both passed
    if (G.playerPassed && G.botPassed) {
        endRound();
        return;
    }
    
    // Bot takes turn
    setTimeout(() => {
        botTakeTurn();
        
        // Check again after bot action
        if (G.playerPassed && G.botPassed) {
            setTimeout(() => endRound(), 1000);
            return;
        }
        
        // If player passed but bot didn't, bot plays then passes
        if (G.playerPassed && !G.botPassed) {
            setTimeout(() => {
                if (!G.botPassed && G.botHand.length > 0) {
                    // Bot plays one more card
                    const idx = Math.floor(Math.random() * G.botHand.length);
                    const card = G.botHand[idx];
                    const lane = card.line === 'left' ? 'botLeft' : card.line === 'right' ? 'botRight' : (Math.random() > 0.5 ? 'botLeft' : 'botRight');
                    G[lane].push(card);
                    G.botHand.splice(idx, 1);
                    showToast(`Бот сыграл «${card.name}» и пасанул`);
                }
                G.botPassed = true;
                setTimeout(() => endRound(), 1500);
            }, 1000);
        }
        
        renderGameBoard();
    }, 500);
}

// ==================== BOT AI ====================
function botTakeTurn() {
    if (G.botPassed) return;
    
    const pScore = calcScore('player');
    const bScore = calcScore('bot');

    // Bot passes if player passed and bot is winning
    if (G.playerPassed && bScore > pScore) {
        G.botPassed = true;
        showToast("Бот пасанул.");
        return;
    }

    // Bot passes if no cards
    if (G.botHand.length === 0) {
        G.botPassed = true;
        showToast("Бот пасанул (нет карт).");
        return;
    }

    // Play a random card
    const idx = Math.floor(Math.random() * G.botHand.length);
    const card = G.botHand[idx];
    const lane = card.line === 'left' ? 'botLeft' :
                 card.line === 'right' ? 'botRight' :
                 (Math.random() > 0.5 ? 'botLeft' : 'botRight');

    G[lane].push(card);
    G.botHand.splice(idx, 1);
    applyCardEffect(card, 'bot', lane === 'botLeft' ? 'left' : 'right');
    showToast(`Бот сыграл «${card.name}»`);
}

// ==================== ROUND END ====================
function endRound() {
    clearInterval(turnTimer);
    
    const pScore = calcScore('player');
    const bScore = calcScore('bot');
    let roundMsg = '';
    
    if (pScore > bScore) {
        G.playerSwords++;
        roundMsg = `⚔️ Вы выиграли раунд ${G.round}! (${pScore} vs ${bScore}) +1 Меч`;
    } else if (bScore > pScore) {
        G.botSwords++;
        roundMsg = `💀 Бот выиграл раунд ${G.round}! (${bScore} vs ${pScore})`;
    } else {
        roundMsg = `🤝 Ничья в раунде ${G.round}! (${pScore} : ${bScore})`;
    }

    if (G.playerSwords >= 2 || G.botSwords >= 2 || G.round >= 3) {
        showRoundEndScreen(roundMsg, true);
        return;
    }

    showRoundEndScreen(roundMsg, false);
}

function showRoundEndScreen(message, isGameOver) {
    const container = document.getElementById('game-board');
    const nextRound = G.round + 1;
    
    container.innerHTML = `
        <div style="max-width:600px; margin:0 auto; text-align:center; padding:40px 20px;">
            <h1 style="font-size:1.8em; color:#d4af37; margin-bottom:20px;">${message}</h1>
            <div style="display:flex; justify-content:center; gap:40px; margin:20px 0; font-size:1.3em;">
                <div>🗡️ Ваши мечи: <strong style="color:#4caf50;">${G.playerSwords}</strong></div>
                <div>🗡️ Мечи бота: <strong style="color:#ef5350;">${G.botSwords}</strong></div>
            </div>
            ${isGameOver ?
                `<h2 style="font-size:2em; margin:20px 0; color:${G.playerSwords >= 2 ? '#4caf50' : '#ef5350'}">
                    ${G.playerSwords >= 2 ? '🏆 ПОБЕДА!' : G.botSwords >= 2 ? '💀 ПОРАЖЕНИЕ' : G.playerSwords > G.botSwords ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}
                </h2>
                <button onclick="startMulliganPhase()" style="margin:10px; background:transparent; border:2px solid rgba(255,255,255,0.5); color:#fff;">🔄 Новая игра</button>
                <button onclick="showMainMenu()" style="margin:10px; background:transparent; border:2px solid rgba(255,255,255,0.3); color:#aaa; min-width:auto;">🏠 Меню</button>`
                :
                `<p style="color:#b39ddb; margin-bottom:20px;">После раунда обе стороны тянут по 1 карте.</p>
                <button onclick="nextRoundBegin()" style="background:transparent; border:2px solid rgba(255,215,0,0.6); color:#ffd740; padding:14px 40px; font-size:1.1em;">
                    ⚔️ Раунд ${nextRound}
                </button>`
            }
        </div>
    `;
}

function nextRoundBegin() {
    G.round++;
    
    if (G.playerDeck.length > 0) {
        G.playerHand.push(G.playerDeck.shift());
    }
    if (G.botDeck.length > 0) {
        G.botHand.push(G.botDeck.shift());
    }

    G.playerLeft = [];
    G.playerRight = [];
    G.botLeft = [];
    G.botRight = [];
    G.playerPassed = false;
    G.botPassed = false;
    G.playerHasPlayedThisTurn = false;
    G.leaderUsed = false;
    G.botLeaderUsed = false;

    renderGameBoard();
    showToast(`Раунд ${G.round} начался!`);
    startTurnTimer();
}

function surrenderGame() {
    if (!confirm('Сдаться?')) return;
    G.botSwords = 2;
    endRound();
}

// ==================== CARD EFFECTS ====================
function applyCardEffect(card, side, lane) {
    const effectText = (card.effect || '').toLowerCase();
    const isPlayer = side === 'player';
    
    const ownLeft = isPlayer ? G.playerLeft : G.botLeft;
    const ownRight = isPlayer ? G.playerRight : G.botRight;
    const oppLeft = isPlayer ? G.botLeft : G.playerLeft;
    const oppRight = isPlayer ? G.botRight : G.playerRight;
    const ownLane = lane === 'left' ? ownLeft : ownRight;

    // Damage effects
    if (effectText.includes('наносит') && effectText.includes('урон')) {
        const dmgMatch = effectText.match(/(\d+)\s*урон/);
        const dmg = dmgMatch ? parseInt(dmgMatch[1]) : 1;
        const allOpp = [...oppLeft, ...oppRight];
        if (allOpp.length > 0) {
            const target = allOpp[Math.floor(Math.random() * allOpp.length)];
            target.power = Math.max(0, (target.power || 0) - dmg);
        }
    }

    // Buff own card
    if ((effectText.includes('к силе') || effectText.includes('получает +')) && effectText.includes('+')) {
        const buffMatch = effectText.match(/\+(\d+)/);
        const buff = buffMatch ? parseInt(buffMatch[1]) : 2;
        const ownCards = [...ownLeft, ...ownRight];
        if (ownCards.length > 0) {
            const target = ownCards[Math.floor(Math.random() * ownCards.length)];
            target.power = (target.power || 0) + buff;
        }
    }

    // Buff entire row
    if (effectText.includes('все карты в ряду') || effectText.includes('всем картам в ряду')) {
        const buffMatch = effectText.match(/\+(\d+)/);
        const buff = buffMatch ? parseInt(buffMatch[1]) : 1;
        ownLane.forEach(c => c.power = (c.power || 0) + buff);
    }

    // Draw from deck
    if (effectText.includes('верхнюю карту') || effectText.includes('возьмите карту из колоды')) {
        const deck = isPlayer ? G.playerDeck : G.botDeck;
        const hand = isPlayer ? G.playerHand : G.botHand;
        if (deck.length > 0) hand.push(deck.shift());
    }

    // Summon tokens
    if (effectText.includes('призывает') || effectText.includes('создаёт')) {
        let token = null;
        if (effectText.includes('демон')) {
            token = { id: 'token_demon', name: 'Демон', type: 'white', line: 'right', power: 4, influence: 0, maxCopies: 99, effect: '' };
        } else if (effectText.includes('призрак')) {
            token = { id: 'token_ghost', name: 'Призрак', type: 'white', line: 'any', power: 1, influence: 0, maxCopies: 99, effect: '' };
        }
        if (token) ownLane.push(token);
    }
}

// ==================== ONLINE (placeholder) ====================
function startOnlineMatch() {
    showToast("Онлайн-режим в разработке!");
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
    }
    
    detectDevice();
    
    const btnOnline = document.getElementById('btn-online');
    const btnMyDecks = document.getElementById('btn-my-decks');
    const btnBot = document.getElementById('btn-bot');
    const btnNewDeck = document.getElementById('btn-new-deck');
    const btnBackDecks = document.getElementById('btn-back-from-decks');
    const btnBackBuilder = document.getElementById('btn-back-to-menu');
    const btnSaveDeck = document.getElementById('btn-save-deck');

    if (btnOnline) btnOnline.onclick = startOnlineMatch;
    if (btnMyDecks) btnMyDecks.onclick = showMyDecks;
    if (btnBot) btnBot.onclick = showMyDecks;
    if (btnNewDeck) btnNewDeck.onclick = () => {
        currentDeck = [];
        selectedLeader = null;
        showDeckBuilder();
    };
    if (btnBackDecks) btnBackDecks.onclick = showMainMenu;
    if (btnBackBuilder) btnBackBuilder.onclick = showMainMenu;
    if (btnSaveDeck) btnSaveDeck.onclick = () => {
        if (typeof window.saveCurrentDeck === 'function') window.saveCurrentDeck();
    };

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
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 2800);
    };

    savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];
    showMainMenu();
    renderMainFactionLogos();
    console.log("✅ Lily Wars initialized!");
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
        btn.innerHTML = `<span style="font-size:0.9em; padding:6px; display:flex; align-items:center; justify-content:center; text-align:center;">${f.name}</span>`;
        btn.onclick = () => showFactionLoreModal(key);
        container.appendChild(btn);
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    detectDevice();
    if (G && G.phase === 'play') {
        renderGameBoard();
    }
});
