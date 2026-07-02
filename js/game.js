// Lily Wars v0.9.3 — Clean Production Build
// Полностью переписанный чистый код с мобильной версией

let currentDeckForGame = null;
let savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];
let G = {};

let turnTimerInterval = null;
let turnTimeLeft = 30;

function detectMobile() {
    return window.innerWidth <= 820 || /Android|iPhone|iPad/i.test(navigator.userAgent);
}

function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2500);
}

// Простая инициализация состояния (минимальная для работы)
function initGameState(deck) {
    G = {
        round: 1,
        playerSwords: 0,
        botSwords: 0,
        phase: 'play',
        playerPassed: false,
        botPassed: false,
        playerHand: [...deck.cards].slice(0, 10),
        playerLeft: [],
        playerRight: [],
        botLeft: [],
        botRight: [],
        playerLeader: deck.leader || {name: "Лидер", effect: "Нет эффекта"},
        botFaction: "knights"
    };
}

function calcScore(side) {
    if (side === 'player') {
        return [...G.playerLeft, ...G.playerRight].reduce((s, c) => s + (c.power || 0), 0);
    }
    return [...G.botLeft, ...G.botRight].reduce((s, c) => s + (c.power || 0), 0);
}

function startTurnTimer() {
    clearTurnTimer();
    if (G.playerPassed) return;
    turnTimeLeft = 30;

    let timerEl = document.getElementById('turn-timer');
    if (!timerEl && detectMobile()) {
        timerEl = document.createElement('div');
        timerEl.id = 'turn-timer';
        timerEl.className = 'timer';
        const header = document.querySelector('.mobile-game-header');
        if (header) header.appendChild(timerEl);
    }
    if (timerEl) timerEl.textContent = turnTimeLeft;

    turnTimerInterval = setInterval(() => {
        turnTimeLeft--;
        if (timerEl) timerEl.textContent = turnTimeLeft;
        if (turnTimeLeft <= 0) {
            clearTurnTimer();
            if (!G.playerPassed) {
                showToast("Время вышло! Авто-пасс.");
                playerPass();
            }
        }
    }, 1000);
}

function clearTurnTimer() {
    if (turnTimerInterval) clearInterval(turnTimerInterval);
    const el = document.getElementById('turn-timer');
    if (el) el.remove();
}

function playerPass() {
    G.playerPassed = true;
    clearTurnTimer();
    showToast("Ты пасанул.");
    // Простая логика бота
    setTimeout(() => {
        G.botPassed = true;
        endRound();
    }, 800);
}

function endRound() {
    const p = calcScore('player');
    const b = calcScore('bot');
    if (p > b) G.playerSwords++;
    else if (b > p) G.botSwords++;

    const container = document.getElementById('game-board');
    container.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color:#fff;">
            <h2>Раунд ${G.round} завершён</h2>
            <p style="font-size:1.4em; margin:20px 0;">${p} : ${b}</p>
            <button onclick="nextRound()" style="width:auto; padding:16px 50px;">Следующий раунд</button>
        </div>
    `;
}

function nextRound() {
    G.round++;
    G.playerPassed = false;
    G.botPassed = false;
    G.playerLeft = [];
    G.playerRight = [];
    G.botLeft = [];
    G.botRight = [];
    renderGameBoard();
    startTurnTimer();
}

function renderGameBoard() {
    const container = document.getElementById('game-board');
    if (!container) return;
    clearTurnTimer();

    if (detectMobile()) {
        // === ЧИСТЫЙ МОБИЛЬНЫЙ ИНТЕРФЕЙС (как на скриншоте) ===
        container.innerHTML = `
            <div class="mobile-game-header">
                <div>
                    <div style="color:#d4af37; font-weight:bold;">Раунд ${G.round}/3</div>
                    <div style="font-size:0.9em;">🗡️ ${G.playerSwords} : ${G.botSwords}</div>
                </div>
                <div id="turn-timer" class="timer">30</div>
            </div>

            <div class="mobile-lanes-container">
                <!-- Бот -->
                <div class="mobile-section enemy">
                    <h4 style="color:#ef9a9a; text-align:center;">БОТ</h4>
                    <div class="mobile-lanes">
                        <div class="mobile-lane"><h5>Ближний</h5><div id="bot-left" class="cards"></div></div>
                        <div class="mobile-lane"><h5>Дальний</h5><div id="bot-right" class="cards"></div></div>
                    </div>
                </div>

                <!-- Игрок -->
                <div class="mobile-section player">
                    <h4 style="color:#64b5f6; text-align:center;">ТЫ</h4>
                    <div class="mobile-lanes">
                        <div class="mobile-lane"><h5>Ближний</h5><div id="player-left" class="cards"></div></div>
                        <div class="mobile-lane"><h5>Дальний</h5><div id="player-right" class="cards"></div></div>
                    </div>
                </div>
            </div>

            <div class="mobile-actions">
                <button onclick="playerPass()">🏳️ Пасс</button>
                <button onclick="showToast('Умение лидера (в разработке)')">👑 Умение</button>
                <button onclick="showPlayerHandModal()">🃏 Рука</button>
                <button onclick="surrenderGame()">🏳 Сдаться</button>
            </div>
        `;
        startTurnTimer();
    } else {
        // Desktop заглушка (пока)
        container.innerHTML = `<div style="padding:40px; text-align:center; color:#fff;">Desktop версия будет в следующем обновлении. Сейчас работает мобильная.</div>`;
    }
}

function showPlayerHandModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:300;';
    modal.innerHTML = `
        <div style="background:#1a1328; padding:20px; border-radius:16px; max-width:92%; width:92%;">
            <h3 style="color:#64b5f6; margin-bottom:16px;">Твоя рука</h3>
            <div id="hand-cards" style="display:flex; flex-wrap:wrap; gap:8px;"></div>
            <button onclick="this.closest('div[style*=\"position:fixed\"]').remove()" style="margin-top:16px; width:100%;">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);

    const cont = modal.querySelector('#hand-cards');
    (G.playerHand || []).forEach((card, i) => {
        const el = document.createElement('div');
        el.style.cssText = 'background:#2c1f4a; border:2px solid #7b5aa6; border-radius:10px; padding:8px; width:82px; color:#fff; font-size:0.75em;';
        el.innerHTML = `<strong>${card.name}</strong><br>⚔️ ${card.power || 0}`;
        el.onclick = () => {
            modal.remove();
            // Простая игра карты
            G.playerLeft.push(card);
            G.playerHand.splice(i, 1);
            renderGameBoard();
        };
        cont.appendChild(el);
    });
}

function surrenderGame() {
    if (confirm('Сдаться?')) {
        G.botSwords = 2;
        endRound();
    }
}

function startMulliganPhase(deck) {
    initGameState(deck);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-game').classList.add('active');
    renderGameBoard();
    showToast("Игра началась! У тебя 30 секунд на ход.");
}

// Простая заглушка для меню
function showMainMenu() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-main').classList.add('active');
}

function showMyDecks() {
    showToast("Мои колоды — в разработке. Пока используй 'Играть с ботом'.");
}

function selectDeckForGame(index) {
    currentDeckForGame = savedDecks[index];
    startMulliganPhase(currentDeckForGame);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Простая заглушка кнопок меню
    const btnBot = document.getElementById('btn-bot');
    if (btnBot) btnBot.onclick = () => {
        if (savedDecks.length > 0) {
            selectDeckForGame(0);
        } else {
            showToast("Сначала создай колоду!");
        }
    };

    const btnMy = document.getElementById('btn-my-decks');
    if (btnMy) btnMy.onclick = showMyDecks;

    showMainMenu();
    console.log("✅ Lily Wars v0.9.3 Clean Build загружен");
});
