// ==================== LILY WARS — Game Engine (Single Player vs Bot) ====================

let currentDeckForGame = null;
let game = null;

class LilyWarsGame {
  constructor(playerDeck) {
    this.playerDeck = [...playerDeck.cards];
    this.playerHealth = 30;
    this.opponentHealth = 30;
    this.playerBoard = { left: [], right: [] };
    this.opponentBoard = { left: [], right: [] };
    this.playerHand = [];
    this.opponentHand = [];
    this.currentTurn = 'player';
    this.round = 1;
    this.selectedCardIndex = null;
    this.slotsPerRow = 4;
  }

  start() {
    this.shuffle(this.playerDeck);
    this.playerHand = this.playerDeck.splice(0, 6);
    this.opponentDeck = this.generateBotDeck();
    this.shuffle(this.opponentDeck);
    this.opponentHand = this.opponentDeck.splice(0, 6);
    this.currentTurn = 'player';
    this.render();
    showToast("Игра началась! Твой ход.");
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  generateBotDeck() {
    const factionKeys = Object.keys(FACTIONS);
    const botFaction = factionKeys[Math.floor(Math.random() * factionKeys.length)];
    return [...FACTIONS[botFaction].cards];
  }

  getPlayerBoardCards() { return [...this.playerBoard.left, ...this.playerBoard.right]; }
  getOpponentBoardCards() { return [...this.opponentBoard.left, ...this.opponentBoard.right]; }

  calculatePower(side) {
    const board = side === 'player' ? this.playerBoard : this.opponentBoard;
    let total = 0;
    Object.values(board).forEach(row => row.forEach(card => total += card.power || 0));
    return total;
  }

  playCard(handIndex, row) {
    if (this.currentTurn !== 'player') { showToast("Сейчас не твой ход!"); return false; }
    const card = this.playerHand[handIndex];
    if (!card) return false;

    const targetRow = this.playerBoard[row];
    if (!targetRow || targetRow.length >= this.slotsPerRow) { showToast("Линия заполнена!"); return false; }

    if (card.row && card.row !== 'any' && card.row !== row) {
      showToast(`Карта только на ${card.row === 'left' ? 'левой' : 'правой'} линии`);
      return false;
    }

    targetRow.push(card);
    this.playerHand.splice(handIndex, 1);
    this.applyOnPlayEffect(card, 'player');
    this.render();
    return true;
  }

  applyOnPlayEffect(card, side) {
    const effect = (card.effect || '').toLowerCase();
    const isPlayer = side === 'player';
    const enemyHealthProp = isPlayer ? 'opponentHealth' : 'playerHealth';

    if (effect.includes('урон') || effect.includes('нанести')) {
      const enemyCards = this.getOpponentBoardCards();
      if (enemyCards.length > 0 && Math.random() > 0.4) {
        const target = enemyCards[Math.floor(Math.random() * enemyCards.length)];
        target.power = Math.max(0, (target.power || 0) - 2);
      } else {
        this[enemyHealthProp] = Math.max(0, this[enemyHealthProp] - 3);
      }
      showToast(`${card.name} нанёс урон!`);
    }
    
    if (effect.includes('исцел')) {
      this[isPlayer ? 'playerHealth' : 'opponentHealth'] = Math.min(30, this[isPlayer ? 'playerHealth' : 'opponentHealth'] + 3);
      showToast(`${card.name} исцелил!`);
    }
  }

  botTurn() {
    if (this.currentTurn !== 'opponent' || !this.opponentHand.length) {
      this.resolveRound();
      this.currentTurn = 'player';
      this.render();
      showToast("Твой ход!");
      return;
    }

    const playable = this.opponentHand.filter(c => {
      const r = c.row || 'left';
      return this.opponentBoard[r] && this.opponentBoard[r].length < this.slotsPerRow;
    });

    if (playable.length > 0) {
      const card = playable[Math.floor(Math.random() * playable.length)];
      const row = card.row && card.row !== 'any' ? card.row : (Math.random() > 0.5 ? 'left' : 'right');
      if (this.opponentBoard[row] && this.opponentBoard[row].length < this.slotsPerRow) {
        this.opponentBoard[row].push(card);
        const idx = this.opponentHand.indexOf(card);
        this.opponentHand.splice(idx, 1);
        this.applyOnPlayEffect(card, 'opponent');
      }
    }

    setTimeout(() => {
      this.resolveRound();
      this.currentTurn = 'player';
      this.render();
      showToast("Твой ход!");
    }, 1100);
  }

  resolveRound() {
    const pPower = this.calculatePower('player');
    const oPower = this.calculatePower('opponent');

    if (pPower > oPower) {
      const dmg = Math.max(2, Math.floor((pPower - oPower) / 2));
      this.opponentHealth = Math.max(0, this.opponentHealth - dmg);
      showToast(`Ты выиграл раунд! Бот -${dmg} HP`);
    } else if (oPower > pPower) {
      const dmg = Math.max(2, Math.floor((oPower - pPower) / 2));
      this.playerHealth = Math.max(0, this.playerHealth - dmg);
      showToast(`Бот выиграл раунд! Ты -${dmg} HP`);
    } else {
      showToast("Равенство в раунде.");
    }

    this.playerBoard = { left: [], right: [] };
    this.opponentBoard = { left: [], right: [] };
    this.round++;

    if (this.playerHealth <= 0) this.endGame(false);
    else if (this.opponentHealth <= 0) this.endGame(true);
  }

  endGame(playerWon) {
    const msg = playerWon ? "🎉 Победа! Ты победил бота!" : "💀 Поражение...";
    showToast(msg, 6000);
    setTimeout(() => {
      if (confirm(msg + "\n\nСыграть ещё раз?")) {
        if (currentDeckForGame) startBotGameWithDeck(currentDeckForGame);
        else showMainMenu();
      } else showMainMenu();
    }, 1600);
  }

  render() {
    const ph = document.getElementById('player-health');
    const oh = document.getElementById('opponent-health');
    if (ph) ph.textContent = this.playerHealth;
    if (oh) oh.textContent = this.opponentHealth;

    const pp = document.getElementById('player-power');
    const op = document.getElementById('opponent-power');
    if (pp) pp.textContent = this.calculatePower('player');
    if (op) op.textContent = this.calculatePower('opponent');

    const status = document.getElementById('game-status');
    if (status) status.textContent = this.currentTurn === 'player' ? 'Твой ход' : 'Ход бота...';

    this.renderBoard('player-left', this.playerBoard.left, false);
    this.renderBoard('player-right', this.playerBoard.right, false);
    this.renderBoard('opponent-left', this.opponentBoard.left, true);
    this.renderBoard('opponent-right', this.opponentBoard.right, true);
    this.renderHand();
  }

  renderBoard(id, cards, isOpponent) {
    const cont = document.getElementById(id);
    if (!cont) return;
    cont.innerHTML = '';
    cards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'card on-board';
      el.style.borderColor = isOpponent ? '#f87171' : '#4ade80';
      el.innerHTML = `<div style="font-weight:700;font-size:0.95em">${card.name}</div><div style="font-size:0.85em">Сила: <strong>${card.power}</strong></div>`;
      cont.appendChild(el);
    });
  }

  renderHand() {
    const cont = document.getElementById('player-hand');
    if (!cont) return;
    cont.innerHTML = '';
    this.playerHand.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'card in-hand';
      el.style.cursor = 'pointer';
      el.innerHTML = `<div style="font-weight:700">${card.name}</div><div style="font-size:0.85em">С:${card.power} В:${card.influence}</div>`;
      el.onclick = () => {
        this.selectedCardIndex = idx;
        showToast(`Выбрана ${card.name}. Кликни по линии слева или справа.`);
        document.querySelectorAll('.player-row').forEach(rowEl => {
          rowEl.style.boxShadow = '0 0 0 3px #4ade80';
          rowEl.onclick = () => {
            const rowName = rowEl.dataset.row;
            if (this.playCard(this.selectedCardIndex, rowName)) {
              document.querySelectorAll('.player-row').forEach(r => { r.style.boxShadow = ''; r.onclick = null; });
              this.selectedCardIndex = null;
            }
          };
        });
      };
      cont.appendChild(el);
    });
  }
}

function startBotGameWithDeck(deck) {
  currentDeckForGame = deck;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-game').classList.add('active');
  game = new LilyWarsGame(deck);
  game.start();
  window.currentGame = game;
}

function endPlayerTurn() {
  if (!game || game.currentTurn !== 'player') return;
  game.currentTurn = 'opponent';
  game.render();
  showToast("Ход бота...");
  setTimeout(() => { if (game) game.botTurn(); }, 700);
}

function surrenderGame() {
  if (game && confirm("Сдаться?")) game.endGame(false);
}

function startBotGame() {
  if (!currentDeckForGame) {
    showToast("Сначала выберите колоду!");
    showMyDecks();
    return;
  }
  startBotGameWithDeck(currentDeckForGame);
}

window.startBotGameWithDeck = startBotGameWithDeck;
window.endPlayerTurn = endPlayerTurn;
