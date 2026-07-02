let currentDeckForGame = null;
let savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];
let G = {};
let isMobile = false;
let turnTimer = null;
let timeLeft = 30;

const FACTION_LORE = {
    knights: "Рыцари Цветка Лилии — благородный орден защитников королевства.",
    blacklily: "Прислужники Черной Лилии — тёмный культ, поклоняющийся древней силе.",
    dryads: "Дриады Леса Нидолион — древние хранители природы и магии леса.",
    wizards: "Орден Чародеев — могущественные маги, изучающие все школы магии."
};

function detectDevice() {
    isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function initGameState(playerDeckData) {
    const botFaction = Object.keys(FACTIONS).find(f => f !== playerDeckData.faction) || 'knights';
    let botCards = [...FACTIONS[botFaction].cards];
    while (botCards.length < 25) {
        botCards.push({...botCards[Math.floor(Math.random() * botCards.length)]});
    }
    
    G = {
        round: 1, playerSwords: 0, botSwords: 0,
        playerPassed: false, botPassed: false,
        playerHasPlayedThisTurn: false, leaderUsed: false,
        phase: 'play',
        playerDeckFull: [...playerDeckData.cards],
        playerDeck: [], playerHand: [], playerLeft: [], playerRight: [], playerDiscard: [],
        botDeck: botCards, botHand: [], botLeft: [], botRight: [], botDiscard: [],
        playerLeader: playerDeckData.leader || getFactionLeader(playerDeckData.faction),
        botLeader: getFactionLeader(botFaction),
        playerFaction: playerDeckData.faction, botFaction: botFaction,
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

// ==================== ТАЙМЕР ====================
function startTimer() {
    clearInterval(turnTimer);
    timeLeft = 30;
    updateTimerUI();
    turnTimer = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) {
            clearInterval(turnTimer);
            if (!G.playerPassed) {
                playerPass();
                showToast("️ Время вышло! Автоматический пас.");
            }
        }
    }, 1000);
}

function updateTimerUI() {
    const el = document.getElementById('turn-timer');
    const val = document.getElementById('timer-val');
    if (el && val) {
        val.textContent = timeLeft;
        if (timeLeft <= 10) el.classList.add('urgent');
        else el.classList.remove('urgent');
    }
}

function stopTimer() {
    clearInterval(turnTimer);
    const el = document.getElementById('turn-timer');
    if (el) el.style.display = 'none';
}

// ==================== ЭКРАНЫ ====================
function showMainMenu() {
    stopTimer();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-main').classList.add('active');
    detectDevice();
}

function showMyDecks() {
    stopTimer();
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-my-decks').classList.add('active');
    renderDecksList();
}

function renderDecksList() {
    const container = document.getElementById('decks-list');
    container.innerHTML = '';
    if (savedDecks.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#aaa;">Нет сохраненных колод.</p>';
        return;
    }
    savedDecks.forEach((deck, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background:rgba(0,0,0,0.4); margin:10px auto; padding:15px; border-radius:12px; border:1px solid #7b5aa6; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;';
        div.innerHTML = `
            <div>
                <strong style="color:#ffccff; font-size:1.1em;">${deck.name}</strong><br>
                <span style="color:#b39ddb;">${deck.factionName}</span> — ${deck.cards.length} карт
            </div>
            <div>
                <button onclick="selectDeckForGame(${index})" style="min-width:auto; padding:8px 15px;">Играть</button>
                <button onclick="deleteDeck(${index})" style="min-width:auto; padding:8px 15px; border-color:#ef5350;">✕</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function deleteDeck(index) {
    if (confirm('Удалить колоду?')) {
        savedDecks.splice(index, 1);
        localStorage.setItem('lilyDecks', JSON.stringify(savedDecks));
        renderDecksList();
    }
}

function selectDeckForGame(deckIndex) {
    currentDeckForGame = savedDecks[deckIndex];
    startMulliganPhase();
}

function showFactionLoreModal(factionId) {
    const f = FACTIONS[factionId];
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:450px;">
            <h2 style="color:#ffccff; margin-bottom:15px;">${f.name}</h2>
            <div style="text-align:left; line-height:1.5; color:#e1bee7; margin-bottom:20px;">${FACTION_LORE[factionId] || "Лор в разработке."}</div>
            <button onclick="this.closest('.modal').remove()" style="min-width:auto; padding:8px 20px;">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ==================== ИГРА ====================
function startMulliganPhase() {
    if (!currentDeckForGame || currentDeckForGame.cards.length < 10) {
        showToast("Нужно минимум 10 карт в колоде!");
        return;
    }
    initGameState(currentDeckForGame);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-game').classList.add('active');
    detectDevice();
    renderGameBoard();
    showToast("Игра началась! Раунд 1");
    startTimer();
}

function calcScore(side) {
    if (side === 'player') return [...G.playerLeft, ...G.playerRight].reduce((s, c) => s + (c.power || 0), 0);
    return [...G.botLeft, ...G.botRight].reduce((s, c) => s + (c.power || 0), 0);
}

function renderGameBoard() {
    const container = document.getElementById('game-board');
    if (!container) return;
    
    const pScore = calcScore('player');
    const bScore = calcScore('bot');

    // Обновляем мобильную шапку
    if (isMobile) {
        document.getElementById('m-round').textContent = G.round;
        document.getElementById('m-p-swords').textContent = G.playerSwords;
        document.getElementById('m-b-swords').textContent = G.botSwords;
        document.getElementById('m-p-score').textContent = pScore;
        document.getElementById('m-b-score').textContent = bScore;
    }

    let html = `
        <div style="max-width:900px; margin:0 auto;">
            <div class="desktop-only" style="text-align:center; margin-bottom:15px;">
                <h2 style="color:#d4af37;">Раунд ${G.round} / 3</h2>
                <div style="display:flex; justify-content:center; gap:30px; margin-top:5px;">
                    <span>🗡️ Вы: <strong style="color:#4caf50;">${G.playerSwords}</strong> (Очки: ${pScore})</span>
                    <span>🗡️ Бот: <strong style="color:#ef5350;">${G.botSwords}</strong> (Очки: ${bScore})</span>
                </div>
            </div>

            <!-- ПОЛЕ БОТА -->
            <div style="margin-bottom:10px;">
                <div style="color:#ef9a9a; font-weight:bold; margin-bottom:5px; text-align:center;">БОТ (${G.botFaction}) ${G.botPassed ? '<span style="color:#ff8a80;">[ПАСС]</span>' : ''}</div>
                <div class="lanes">
                    <div class="lane left"><h4>Ближний ряд</h4><div class="cards" id="bot-left"></div></div>
                    <div class="lane right"><h4>Дальний ряд</h4><div class="cards" id="bot-right"></div></div>
                </div>
            </div>

            <div style="height:1px; background:rgba(255,255,255,0.2); margin:10px 0;"></div>

            <!-- ПОЛЕ ИГРОКА -->
            <div>
                <div style="color:#64b5f6; font-weight:bold; margin-bottom:5px; text-align:center;">ВЫ ${G.playerPassed ? '<span style="color:#ff8a80;">[ПАСС]</span>' : ''}</div>
                <div class="lanes">
                    <div class="lane left"><h4>Ближний ряд</h4><div class="cards" id="player-left"></div></div>
                    <div class="lane right"><h4>Дальний ряд</h4><div class="cards" id="player-right"></div></div>
                </div>
            </div>

            <!-- РУКА (ПК) -->
            <div class="hand desktop-only">
                <h4 style="color:#d4af37; margin-bottom:8px; text-align:center;">Ваша рука (${G.playerHand.length})</h4>
                <div id="player-hand" class="cards"></div>
            </div>

            <!-- КНОПКИ (ПК) -->
            <div class="desktop-only" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:15px;">
                ${!G.playerPassed ? `
                    <button onclick="playerEndTurn()" style="border-color:rgba(100,200,100,0.6);">✅ Завершить ход</button>
                    <button onclick="playerPass()" style="border-color:rgba(255,150,80,0.6);">🏳️ Пасс</button>
                ` : '<div style="color:#ff8a80; padding:12px;">Вы пасанули</div>'}
                ${!G.leaderUsed && !G.playerPassed && G.playerLeader ? `<button onclick="showLeaderAbilityModal()" style="border-color:rgba(255,215,0,0.6); color:#ffd740;">👑 Умение лидера</button>` : ''}
            </div>
        </div>
    `;

    container.innerHTML = html;

    renderLaneCards('player-left', G.playerLeft, false);
    renderLaneCards('player-right', G.playerRight, false);
    renderLaneCards('bot-left', G.botLeft, true);
    renderLaneCards('bot-right', G.botRight, true);
    
    if (!isMobile) renderPlayerHandDesktop();
    else renderMobileHand();
}

function renderLaneCards(containerId, cards, isBot) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '';
    if (cards.length === 0) {
        cont.innerHTML = '<div style="color:#555; font-size:0.8em; padding:10px; text-align:center; width:100%;">Пусто</div>';
        return;
    }
    cards.forEach(card => {
        const el = createCardElement(card, false);
        if (isBot) { el.style.filter = 'brightness(0.7)'; el.style.cursor = 'default'; el.onclick = null; }
        cont.appendChild(el);
    });
}

function renderPlayerHandDesktop() {
    const container = document.getElementById('player-hand');
    if (!container) return;
    container.innerHTML = '';
    G.playerHand.forEach((card, idx) => {
        const el = createCardElement(card, false);
        if (!G.playerPassed) el.onclick = () => showLaneSelection(idx);
        else { el.style.opacity = '0.5'; el.style.cursor = 'default'; }
        container.appendChild(el);
    });
}

function renderMobileHand() {
    const container = document.getElementById('mobile-hand-cards');
    if (!container) return;
    container.innerHTML = '';
    G.playerHand.forEach((card, idx) => {
        const el = createCardElement(card, false);
        el.style.width = '70px'; el.style.minHeight = '95px'; el.style.fontSize = '0.6em';
        if (!G.playerPassed) {
            el.onclick = () => {
                document.getElementById('hand-popup').classList.remove('active');
                showLaneSelection(idx);
            };
        } else { el.style.opacity = '0.5'; }
        container.appendChild(el);
    });
}

function showLaneSelection(handIdx) {
    if (G.playerHasPlayedThisTurn) { showToast("Только 1 карта за ход!"); return; }
    const card = G.playerHand[handIdx];
    let allowed = [];
    if (card.line === 'left') allowed = ['left'];
    else if (card.line === 'right') allowed = ['right'];
    else allowed = ['left', 'right'];

    if (allowed.length === 1) { playCardToLane(handIdx, allowed[0]); return; }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:400;';
    overlay.id = 'lane-overlay';
    overlay.innerHTML = `
        <div style="background:#1a0f2e; padding:25px; border-radius:14px; border:2px solid #7b5aa6; text-align:center; max-width:350px; width:90%;">
            <h3 style="color:#d4af37; margin-bottom:20px;">Куда поставить «${card.name}»?</h3>
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                <button onclick="playCardToLane(${handIdx},'left'); document.getElementById('lane-overlay').remove();" style="border-color:#42a5f5; min-width:auto;">🛡️ Ближний</button>
                <button onclick="playCardToLane(${handIdx},'right'); document.getElementById('lane-overlay').remove();" style="border-color:#ef5350; min-width:auto;">🏹 Дальний</button>
            </div>
            <button onclick="document.getElementById('lane-overlay').remove()" style="margin-top:15px; min-width:auto; padding:8px 20px;">Отмена</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function playCardToLane(handIdx, lane) {
    if (G.playerHasPlayedThisTurn) return;
    const card = G.playerHand[handIdx];
    const targetArr = lane === 'left' ? G.playerLeft : G.playerRight;
    targetArr.push(card);
    G.playerHand.splice(handIdx, 1);
    G.playerHasPlayedThisTurn = true;
    applyCardEffect(card, 'player', lane);
    showToast(`Сыграна «${card.name}»`);
    renderGameBoard();
}

function showLeaderAbilityModal() {
    const leader = G.playerLeader;
    if (!leader) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'leader-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3 style="color:#ffd740; margin-bottom:10px;">👑 ${leader.name}</h3>
            <div style="background:rgba(255,215,0,0.1); border:1px solid rgba(255,215,0,0.3); border-radius:10px; padding:12px; margin-bottom:15px; color:#e1bee7; font-size:0.9em;">${leader.effect}</div>
            <button onclick="useLeaderAbility()" style="border-color:rgba(255,215,0,0.6); color:#ffd740; min-width:auto; padding:10px 25px;">✨ Применить</button>
            <button onclick="document.getElementById('leader-modal').remove()" style="min-width:auto; padding:10px 20px;">Отмена</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function useLeaderAbility() {
    document.getElementById('leader-modal')?.remove();
    if (G.leaderUsed) { showToast("Умение уже использовано!"); return; }
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
            showToast(`${leader.name}: ${card.name} возвращена!`);
        } else { showToast("Отбой пуст!"); }
    } else if (effectText.includes('призрак') || effectText.includes('создайте')) {
        const ghost = { id: 'token_ghost', name: 'Призрак', type: 'white', line: 'any', power: 1, influence: 0, maxCopies: 99, effect: '' };
        G.playerLeft.push(ghost);
        showToast(`${leader.name}: Призван Призрак!`);
    } else { showToast(`${leader.name}: умение активировано!`); }
    renderGameBoard();
}

// ==================== ХОДЫ И БОТ ====================
function playerEndTurn() {
    if (!G.playerHasPlayedThisTurn && G.playerHand.length > 0) {
        showToast("Сыграйте карту или нажмите Пасс!"); return;
    }
    G.playerHasPlayedThisTurn = false;
    afterPlayerTurn();
}

function playerPass() {
    G.playerPassed = true;
    showToast("Вы пасанули.");
    afterPlayerTurn();
}

function afterPlayerTurn() {
    // ИСПРАВЛЕНИЕ ЗАВИСАНИЯ: Если игрок пасанул, бот сразу решает и раунд заканчивается
    if (G.playerPassed) {
        clearInterval(turnTimer);
        setTimeout(() => {
            const pScore = calcScore('player');
            const bScore = calcScore('bot');
            
            if (bScore > pScore && G.botHand.length > 0) {
                // Бот выигрывает, просто пасует
                G.botPassed = true;
                showToast("Бот пасует.");
            } else if (G.botHand.length > 0) {
                // Бот играет одну карту и пасует
                botPlayCard();
                G.botPassed = true;
                showToast("Бот сыграл карту и пасует.");
            } else {
                G.botPassed = true;
            }
            setTimeout(() => endRound(), 1200);
        }, 800);
        return;
    }

    // Обычный ход
    botTakeTurn();
    renderGameBoard();
}

function botTakeTurn() {
    if (G.botPassed) return;
    if (G.botHand.length === 0) { G.botPassed = true; return; }
    botPlayCard();
}

function botPlayCard() {
    const idx = Math.floor(Math.random() * G.botHand.length);
    const card = G.botHand[idx];
    const lane = card.line === 'left' ? 'botLeft' : card.line === 'right' ? 'botRight' : (Math.random() > 0.5 ? 'botLeft' : 'botRight');
    G[lane].push(card);
    G.botHand.splice(idx, 1);
    applyCardEffect(card, 'bot', lane === 'botLeft' ? 'left' : 'right');
}

function endRound() {
    clearInterval(turnTimer);
    const pScore = calcScore('player');
    const bScore = calcScore('bot');
    let msg = '';
    if (pScore > bScore) { G.playerSwords++; msg = `⚔️ Вы выиграли раунд ${G.round}! (${pScore} vs ${bScore})`; }
    else if (bScore > pScore) { G.botSwords++; msg = `💀 Бот выиграл раунд ${G.round}!`; }
    else { msg = `🤝 Ничья в раунде ${G.round}!`; }

    if (G.playerSwords >= 2 || G.botSwords >= 2 || G.round >= 3) {
        showGameOver(msg);
    } else {
        showRoundEnd(msg);
    }
}

function showRoundEnd(msg) {
    const container = document.getElementById('game-board');
    container.innerHTML = `
        <div style="text-align:center; padding:40px 20px; max-width:500px; margin:0 auto;">
            <h2 style="color:#d4af37; margin-bottom:20px;">${msg}</h2>
            <p style="color:#b39ddb; margin-bottom:20px;">Мечи: Вы ${G.playerSwords} - ${G.botSwords} Бот</p>
            <button onclick="nextRoundBegin()" style="border-color:rgba(255,215,0,0.6); color:#ffd740; padding:14px 30px; font-size:1.1em;">⚔️ Следующий раунд</button>
        </div>
    `;
}

function nextRoundBegin() {
    G.round++;
    if (G.playerDeck.length > 0) G.playerHand.push(G.playerDeck.shift());
    if (G.botDeck.length > 0) G.botHand.push(G.botDeck.shift());
    G.playerLeft = []; G.playerRight = []; G.botLeft = []; G.botRight = [];
    G.playerPassed = false; G.botPassed = false; G.playerHasPlayedThisTurn = false; G.leaderUsed = false;
    renderGameBoard();
    showToast(`Раунд ${G.round} начался!`);
    startTimer();
}

function showGameOver(msg) {
    const container = document.getElementById('game-board');
    const isWin = G.playerSwords >= 2 || (G.round >= 3 && G.playerSwords > G.botSwords);
    container.innerHTML = `
        <div style="text-align:center; padding:40px 20px; max-width:500px; margin:0 auto;">
            <h1 style="color:${isWin ? '#4caf50' : '#ef5350'}; font-size:2.5em; margin-bottom:10px;">${isWin ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}</h1>
            <h3 style="color:#d4af37; margin-bottom:20px;">${msg}</h3>
            <p style="color:#b39ddb; margin-bottom:30px; font-size:1.2em;">Мечи: Вы ${G.playerSwords} - ${G.botSwords} Бот</p>
            <button onclick="startMulliganPhase()" style="margin:5px;">🔄 Реванш</button>
            <button onclick="showMainMenu()" style="margin:5px;">🏠 В меню</button>
        </div>
    `;
}

function surrenderGame() {
    if (confirm('Сдаться?')) { G.botSwords = 2; endRound(); }
}

function applyCardEffect(card, side, lane) {
    const effectText = (card.effect || '').toLowerCase();
    const isPlayer = side === 'player';
    const ownLeft = isPlayer ? G.playerLeft : G.botLeft;
    const ownRight = isPlayer ? G.playerRight : G.botRight;
    const oppLeft = isPlayer ? G.botLeft : G.playerLeft;
    const oppRight = isPlayer ? G.botRight : G.playerRight;
    const ownLane = lane === 'left' ? ownLeft : ownRight;

    if (effectText.includes('наносит') && effectText.includes('урон')) {
        const dmgMatch = effectText.match(/(\d+)\s*урон/);
        const dmg = dmgMatch ? parseInt(dmgMatch[1]) : 1;
        const allOpp = [...oppLeft, ...oppRight];
        if (allOpp.length > 0) {
            const target = allOpp[Math.floor(Math.random() * allOpp.length)];
            target.power = Math.max(0, (target.power || 0) - dmg);
        }
    }
    if ((effectText.includes('к силе') || effectText.includes('получает +')) && effectText.includes('+')) {
        const buffMatch = effectText.match(/\+(\d+)/);
        const buff = buffMatch ? parseInt(buffMatch[1]) : 2;
        const ownCards = [...ownLeft, ...ownRight];
        if (ownCards.length > 0) {
            const target = ownCards[Math.floor(Math.random() * ownCards.length)];
            target.power = (target.power || 0) + buff;
        }
    }
    if (effectText.includes('все карты в ряду') || effectText.includes('всем картам в ряду')) {
        const buffMatch = effectText.match(/\+(\d+)/);
        const buff = buffMatch ? parseInt(buffMatch[1]) : 1;
        ownLane.forEach(c => c.power = (c.power || 0) + buff);
    }
    if (effectText.includes('верхнюю карту') || effectText.includes('возьмите карту из колоды')) {
        const deck = isPlayer ? G.playerDeck : G.botDeck;
        const hand = isPlayer ? G.playerHand : G.botHand;
        if (deck.length > 0) hand.push(deck.shift());
    }
    if (effectText.includes('призывает') || effectText.includes('создаёт')) {
        let token = null;
        if (effectText.includes('демон')) token = { id: 'token_demon', name: 'Демон', type: 'white', line: 'right', power: 4, influence: 0, maxCopies: 99, effect: '' };
        else if (effectText.includes('призрак')) token = { id: 'token_ghost', name: 'Призрак', type: 'white', line: 'any', power: 1, influence: 0, maxCopies: 99, effect: '' };
        if (token) ownLane.push(token);
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) { Telegram.WebApp.ready(); Telegram.WebApp.expand(); }
    
    detectDevice();

    document.getElementById('btn-online').onclick = () => showToast("Онлайн в разработке!");
    document.getElementById('btn-my-decks').onclick = showMyDecks;
    document.getElementById('btn-bot').onclick = showMyDecks;
    document.getElementById('btn-new-deck').onclick = () => { currentDeck = []; selectedLeader = null; showDeckBuilder(); };
    document.getElementById('btn-back-from-decks').onclick = showMainMenu;
    document.getElementById('btn-back-to-menu').onclick = showMainMenu;
    document.getElementById('btn-save-deck').onclick = () => { if (typeof window.saveCurrentDeck === 'function') window.saveCurrentDeck(); };

    // Мобильные кнопки
    document.getElementById('m-btn-leader').onclick = () => { if (!G.leaderUsed && G.playerLeader) showLeaderAbilityModal(); else showToast("Нельзя использовать!"); };
    document.getElementById('m-btn-pass').onclick = playerPass;
    document.getElementById('m-btn-end').onclick = playerEndTurn;
    document.getElementById('m-btn-surrender').onclick = surrenderGame;
    
    const popupBtn = document.getElementById('hand-popup-btn');
    const popup = document.getElementById('hand-popup');
    if (popupBtn && popup) {
        popupBtn.onclick = () => popup.classList.toggle('active');
    }

    window.showToast = function(msg) {
        let toast = document.getElementById('toast');
        if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; document.body.appendChild(toast); }
        toast.textContent = msg;
        toast.style.display = 'block';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 2500);
    };

    savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];
    showMainMenu();
    renderMainFactionLogos();
});

function renderMainFactionLogos() {
    const container = document.getElementById('main-faction-logos');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(FACTIONS).forEach(key => {
        const f = FACTIONS[key];
        const btn = document.createElement('div');
        btn.className = 'faction-btn';
        btn.style.backgroundImage = `url('${f.emblem}')`;
        btn.innerHTML = `<span>${f.name}</span>`;
        btn.onclick = () => showFactionLoreModal(key);
        container.appendChild(btn);
    });
}

window.addEventListener('resize', () => {
    detectDevice();
    if (G && G.phase === 'play') renderGameBoard();
});