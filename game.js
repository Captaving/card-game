// ═══════════════════════════════════════════════════════════════════════════
// LILY WARS — Client Game Engine
// ═══════════════════════════════════════════════════════════════════════════

const SERVER_URL = 'wss://lily-wars.duckdns.org:8080'; // замените на свой адрес

class GameClient {
  constructor() {
    this.ws          = null;
    this.socketId    = null;
    this.state       = null;  // last game_state from server
    this.myRole      = null;  // 'player1' | 'player2'
    this.pendingAction = null; // { type, resolve }
    this.handlers    = {};
    this.reconnectTimer = null;

    this._connect();
  }

  // ── Connection ────────────────────────────────────────────────────────────
  _connect() {
    this.ws = new WebSocket(SERVER_URL);
    this.ws.onopen    = () => { console.log('Connected'); this._onOpen(); };
    this.ws.onmessage = (e) => this._onMessage(JSON.parse(e.data));
    this.ws.onclose   = () => { console.log('Disconnected'); this._onClose(); };
    this.ws.onerror   = (e) => console.error('WS error', e);
  }

  _onOpen() {
    clearTimeout(this.reconnectTimer);
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    this.send('auth', {
      tgId: tgUser?.id || 'guest_' + Date.now(),
      name: tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}`.trim() : 'Player'
    });
  }

  _onClose() {
    this.reconnectTimer = setTimeout(() => this._connect(), 3000);
  }

  _onMessage(msg) {
    const { type } = msg;
    console.log('←', type, msg);

    // Resolve pending promises
    if (this.handlers[type]) {
      this.handlers[type].forEach(h => h(msg));
      delete this.handlers[type];
    }

    // Route to UI
    switch (type) {
      case 'connected':    this.socketId = msg.socketId; break;
      case 'auth_ok':      UI.onAuthOk(msg); break;
      case 'deck_ok':      UI.onDeckOk(); break;
      case 'in_queue':     UI.onInQueue(msg); break;
      case 'queue_cancelled': UI.onQueueCancelled(); break;
      case 'match_found':  this.myRole = msg.yourRole; UI.onMatchFound(msg); break;
      case 'mulligan_done': UI.onMulliganDone(); break;
      case 'game_start':   UI.onGameStart(); break;
      case 'game_state':   this.state = msg; UI.render(msg); break;
      case 'round_end':    UI.onRoundEnd(msg); break;
      case 'game_over':    UI.onGameOver(msg); break;
      case 'player_passed': UI.onPlayerPassed(msg); break;
      case 'card_added_to_hand': UI.onCardAddedToHand(msg); break;
      case 'reveal_cards': UI.onRevealCards(msg); break;
      case 'reveal_choose': UI.onRevealChoose(msg); break;
      case 'choose_move':  UI.onChooseMove(msg); break;
      case 'error':        UI.showError(msg.message); break;
      case 'pong':         break;
    }
  }

  // ── Send helpers ──────────────────────────────────────────────────────────
  send(type, payload = {}) {
    if (this.ws?.readyState === WebSocket.OPEN)
      this.ws.send(JSON.stringify({ type, ...payload }));
  }

  once(type) {
    return new Promise(resolve => {
      if (!this.handlers[type]) this.handlers[type] = [];
      this.handlers[type].push(resolve);
    });
  }

  // ── Game actions ──────────────────────────────────────────────────────────
  auth(tgId, name)             { this.send('auth', { tgId, name }); }
  setDeck(deck, faction, leader) { this.send('set_deck', { deck, faction, leader }); }
  findMatch()                  { this.send('find_match'); }
  cancelQueue()                { this.send('cancel_queue'); }
  mulligan(cardIds)            { this.send('mulligan', { cardIds }); }

  playCard(cardId, row, targetInfo = {}) {
    this.send('play_card', { cardId, row, targetInfo });
  }

  pass()                       { this.send('pass'); }
  useLeader(targetInfo = {})   { this.send('use_leader', { targetInfo }); }
  forfeit()                    { this.send('forfeit'); }
  takeRevealedCard(cardId)     { this.send('take_revealed_card', { cardId }); }
  ping()                       { this.send('ping'); }
}

// ════════════════════════════════════════════════════════════════════════════
// UI RENDERER
// ════════════════════════════════════════════════════════════════════════════

const FACTION_COLORS = {
  knights:  { primary: '#3498db', bg: '#1a3a5c', text: '#7ec8e3' },
  cultists: { primary: '#555555', bg: '#1a1a2e', text: '#9b59b6' },
  dryads:   { primary: '#2ecc71', bg: '#1a3a2a', text: '#a8e6cf' },
  mages:    { primary: '#926eae', bg: '#2d1b4e', text: '#d7bde2' },
};

const CARD_TYPE_COLORS = {
  white:   { bg: '#e8e8e8', border: '#cccccc' },
  gray:    { bg: '#7f8c8d', border: '#5d6d7e' },
  purple:  { bg: '#6c3483', border: '#9b59b6' },
  gold:    { bg: '#d4ac0d', border: '#f1c40f' },
  special: { bg: '#c0392b', border: '#e74c3c' },
};

const UI = {
  client: null,
  selectedCard: null,       // card object from hand
  awaitingTarget: null,     // { type: 'enemy_card'|'own_card'|'discard', resolve }
  factionChoice: null,
  deckBuilder: null,

  init(client) {
    this.client = client;
    this._bindEvents();
    this._showScreen('screen-main');
  },

  // ── Screens ───────────────────────────────────────────────────────────────
  _showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  },

  onAuthOk(msg) {
    document.getElementById('player-rating').textContent = `Рейтинг: ${msg.rating}`;
    this._showScreen('screen-main');
  },

  onDeckOk() { this._showScreen('screen-main'); },

  onInQueue(msg) {
    document.getElementById('queue-status').textContent = `Поиск соперника... (позиция: ${msg.position})`;
    this._showScreen('screen-queue');
  },

  onQueueCancelled() { this._showScreen('screen-main'); },

  onMatchFound(msg) {
    document.getElementById('match-opponent').textContent = `Соперник: ${msg.opponentName}`;
    this._showScreen('screen-mulligan');
  },

  onMulliganDone() {
    document.getElementById('mulligan-status').textContent = 'Ожидание соперника...';
  },

  onGameStart() { this._showScreen('screen-game'); },

  onRoundEnd(msg) {
    const txt = msg.roundWinner
      ? (msg.roundWinner === this.client.myRole ? 'Вы выиграли раунд!' : 'Соперник выиграл раунд!')
      : 'Раунд — ничья!';
    this.showToast(`${txt} Раунд ${msg.nextRound} начинается...`, 2500);
  },

  onGameOver(msg) {
    const won = msg.winner === this.client.myRole;
    document.getElementById('gameover-title').textContent = won ? '🏆 Победа!' : '💀 Поражение';
    document.getElementById('gameover-reason').textContent = msg.reason === 'forfeit' ? '(сдался)' : msg.reason === 'disconnect' ? '(отключился)' : '';
    if (msg.ratings) {
      const myRating = msg.ratings[this.client.myRole];
      document.getElementById('gameover-rating').textContent = myRating ? `Рейтинг: ${myRating.rating}` : '';
    }
    this._showScreen('screen-gameover');
  },

  onPlayerPassed(msg) {
    const isMe = msg.role === this.client.myRole;
    this.showToast(isMe ? 'Вы спасовали' : 'Соперник спасовал', 1500);
  },

  onCardAddedToHand(msg) {
    this.showToast(`Получена карта: ${msg.card.name}`, 2000);
  },

  onRevealCards(msg) {
    this._showRevealModal(msg.cards, false);
  },

  onRevealChoose(msg) {
    this._showRevealModal(msg.cards, true);
  },

  onChooseMove(msg) {
    this.showToast('Выберите карту для перемещения', 2000);
    this.awaitingTarget = { type: 'own_card_move', cardId: msg.cardId };
  },

  showError(msg) { this.showToast('⚠️ ' + msg, 2000); },

  showToast(msg, duration = 2000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), duration);
  },

  // ── Main render ───────────────────────────────────────────────────────────
  render(state) {
    if (!state.me) return;
    const { me, opponent } = state;
    const myFaction = me.faction || 'knights';
    const colors = FACTION_COLORS[myFaction] || FACTION_COLORS.knights;

    // Apply faction theme
    document.documentElement.style.setProperty('--faction-primary', colors.primary);
    document.documentElement.style.setProperty('--faction-bg', colors.bg);
    document.documentElement.style.setProperty('--faction-text', colors.text);

    // Scores
    document.getElementById('score-me').textContent = me.score;
    document.getElementById('score-opp').textContent = opponent.score;
    document.getElementById('coins-me').textContent = '⬡'.repeat(me.coins);
    document.getElementById('coins-opp').textContent = '⬡'.repeat(opponent.coins);

    // Turn indicator
    document.getElementById('turn-indicator').textContent = state.myTurn ? '← Ваш ход' : 'Ход соперника →';
    document.getElementById('turn-indicator').className = state.myTurn ? 'my-turn' : 'opp-turn';

    // Round
    document.getElementById('round-display').textContent = `Раунд ${state.round}/3`;

    // Opponent info
    document.getElementById('opp-name').textContent = opponent.name;
    document.getElementById('opp-deck-count').textContent = opponent.deck;
    document.getElementById('opp-hand-count').textContent = opponent.handCount;
    document.getElementById('opp-discard-count').textContent = (opponent.discard || []).length;

    // My info
    document.getElementById('my-deck-count').textContent = me.deck;
    document.getElementById('my-discard-count').textContent = (me.discard || []).length;

    // Leader buttons
    this._renderLeader('leader-me', me.leader, me.leaderUsed, false, me.leaderCharges);
    this._renderLeader('leader-opp', opponent.leader, false, true);

    // Pass button
    const passBtn = document.getElementById('btn-pass');
    if (passBtn) {
      passBtn.disabled = !state.myTurn || me.passed;
      passBtn.textContent = me.passed ? 'Спасовал' : 'Пас';
    }

    // Fields
    this._renderField('field-opp-left', opponent.field?.left || [], 'enemy', 'left');
    this._renderField('field-opp-right', opponent.field?.right || [], 'enemy', 'right');
    this._renderField('field-me-left', me.field?.left || [], 'own', 'left');
    this._renderField('field-me-right', me.field?.right || [], 'own', 'right');

    // Row scores
    this._updateRowScore('row-score-opp-left', opponent.field?.left || []);
    this._updateRowScore('row-score-opp-right', opponent.field?.right || []);
    this._updateRowScore('row-score-me-left', me.field?.left || []);
    this._updateRowScore('row-score-me-right', me.field?.right || []);

    // Hand
    this._renderHand(me.hand || [], state.myTurn && !me.passed);
  },

  _renderLeader(containerId, leader, used, isOpponent, charges) {
    const el = document.getElementById(containerId);
    if (!el || !leader) return;
    el.innerHTML = '';
    const btn = document.createElement('div');
    btn.className = `leader-icon${used ? ' used' : ''}${isOpponent ? ' opponent' : ''}`;
    btn.title = leader.ability?.description || '';
    btn.innerHTML = `<div class="leader-name">${leader.name.split(' ').slice(-1)[0]}</div>`;
    if (charges !== undefined) btn.innerHTML += `<div class="leader-charges">${charges}</div>`;
    if (!isOpponent && !used) {
      btn.onclick = () => this._onLeaderClick();
    } else {
      btn.onclick = () => this.showToast(leader.ability?.description || '', 2500);
    }
    el.appendChild(btn);
  },

  _renderField(containerId, cards, side, row) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (const card of cards) {
      const cardEl = this._createCardElement(card, side, row);
      el.appendChild(cardEl);
    }
    // Drop zone indicator
    el.classList.toggle('drop-zone', this.selectedCard !== null && side === 'own');
    el.onclick = () => {
      if (this.selectedCard && side === 'own') this._playSelected(row);
      else if (this.awaitingTarget?.type === 'own_card_move') { /* handled on card click */ }
    };
  },

  _updateRowScore(containerId, cards) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.textContent = cards.reduce((s, c) => s + (c.currentPower || c.power || 0), 0);
  },

  _renderHand(cards, interactive) {
    const el = document.getElementById('hand-container');
    if (!el) return;
    el.innerHTML = '';
    cards.forEach((card, i) => {
      const cardEl = this._createCardElement(card, 'hand', null, interactive);
      cardEl.style.setProperty('--card-index', i);
      if (interactive) {
        cardEl.onclick = (e) => { e.stopPropagation(); this._onHandCardClick(card, cardEl); };
      }
      el.appendChild(cardEl);
    });
  },

  _createCardElement(card, context, row, interactive = false) {
    const div = document.createElement('div');
    const typeColors = CARD_TYPE_COLORS[card.type] || CARD_TYPE_COLORS.white;
    div.className = `card card-${card.type}${interactive ? ' interactive' : ''}`;
    div.style.background = typeColors.bg;
    div.style.borderColor = typeColors.border;

    const power = card.currentPower !== undefined ? card.currentPower : (card.power || 0);
    const hasCurse = card.cursed;

    div.innerHTML = `
      <div class="card-power">${power}</div>
      <div class="card-name">${card.name}</div>
      ${card.effect ? `<div class="card-effect-dot" title="${card.effect.description || ''}">✦</div>` : ''}
      ${card.charges !== undefined ? `<div class="card-charges">⚡${card.charges}</div>` : ''}
      ${hasCurse ? `<div class="card-curse">☠</div>` : ''}
    `;

    if (context === 'enemy') {
      div.onclick = (e) => { e.stopPropagation(); this._onEnemyCardClick(card); };
    } else if (context === 'own' && !interactive) {
      div.onclick = (e) => { e.stopPropagation(); this._onOwnFieldCardClick(card); };
    }

    // Long press for card details
    let pressTimer;
    div.addEventListener('touchstart', () => { pressTimer = setTimeout(() => this._showCardDetail(card), 500); });
    div.addEventListener('touchend', () => clearTimeout(pressTimer));

    return div;
  },

  // ── Interaction ───────────────────────────────────────────────────────────
  _onHandCardClick(card, el) {
    if (this.awaitingTarget) {
      this.awaitingTarget.resolve?.(card);
      this.awaitingTarget = null;
      return;
    }
    if (this.selectedCard?.instanceId === card.instanceId) {
      this._clearSelection();
      return;
    }
    this._clearSelection();
    this.selectedCard = card;
    el.classList.add('selected');
    this._showPlayPrompt(card);
  },

  _showPlayPrompt(card) {
    const effect = card.effect?.description || '';
    const row = card.row;

    if (card.type === 'special' || row === 'any') {
      // Show row selector if needed
      this._showRowSelector(card);
    } else {
      // Auto-place on designated row
      this._playSelected(row);
    }
  },

  _showRowSelector(card) {
    const modal = document.getElementById('row-selector');
    if (!modal) { this._playSelected('left'); return; }
    modal.style.display = 'flex';
    document.getElementById('row-left-btn').onclick  = () => { modal.style.display = 'none'; this._playSelected('left'); };
    document.getElementById('row-right-btn').onclick = () => { modal.style.display = 'none'; this._playSelected('right'); };
  },

  async _playSelected(row) {
    if (!this.selectedCard) return;
    const card   = this.selectedCard;
    this._clearSelection();

    const effect = card.effect;
    let targetInfo = {};

    if (effect) {
      targetInfo = await this._resolveTargetForEffect(card, effect, row);
      if (targetInfo === null) return; // cancelled
    }

    this.client.playCard(card.id || card.instanceId, row, targetInfo);
  },

  async _resolveTargetForEffect(card, effect, placedRow) {
    const targetInfo = { row: placedRow };
    if (!effect) return targetInfo;

    switch (effect.action) {
      case 'buff':
        if (effect.target === 'own_unit_selectable') {
          const chosen = await this._awaitOwnFieldCard('Выберите свою карту для усиления');
          if (!chosen) return null;
          targetInfo.targetCardId = chosen.instanceId;
        } else if (effect.count) {
          // Порошок Ангилеи — pick 3
          const ids = [];
          for (let i = 0; i < effect.count; i++) {
            this.showToast(`Выберите карту ${i+1} из ${effect.count}`, 1500);
            const c = await this._awaitOwnFieldCard();
            if (c) ids.push(c.instanceId);
          }
          targetInfo.targetCardIds = ids;
        }
        break;
      case 'damage':
        if (effect.target?.includes('selectable')) {
          const c = await this._awaitEnemyCard('Выберите карту противника');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        }
        break;
      case 'steal':
        if (effect.target === 'any_enemy_field') {
          const c = await this._awaitEnemyCard('Выберите карту противника для кражи');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        } else if (effect.target === 'enemy_field_selectable') {
          const c = await this._awaitEnemyCard('Выберите карту противника');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        }
        break;
      case 'trap':
        if (effect.trigger === 'enemy_buff') {
          const c = await this._awaitEnemyCard('Выберите карту-мишень для ловушки');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        }
        break;
      case 'curse': {
        const c = await this._awaitEnemyCard('Выберите карту для проклятия');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'returnToHand': {
        const c = await this._awaitOwnFieldCard('Выберите карту для возврата в руку');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'revive': {
        const c = await this._awaitDiscardCard('Выберите карту из отбоя');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'revive_play': {
        const c = await this._awaitDiscardCard('Выберите карту из отбоя (сыграется автоматически)');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'destroy': {
        if (effect.target === 'own_unit_selectable') {
          const c = await this._awaitOwnFieldCard('Уничтожить свою карту');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        } else if (effect.target?.includes('enemy')) {
          const c = await this._awaitEnemyCard('Уничтожить карту противника');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        }
        break;
      }
      case 'consume': {
        const c = await this._awaitOwnFieldCard('Поглотить карту рядом с Чернокнижником');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'consume_buff': {
        const c = await this._awaitOwnFieldCard('Принести в жертву карту для Чернокнижника');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'transform': {
        const c = await this._awaitOwnFieldCard('Трансформировать карту в Ангела Смерти');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'move_row': {
        if (effect.target === 'enemy_unit_selectable') {
          const c = await this._awaitEnemyCard('Выберите карту противника для перемещения');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        }
        break;
      }
      case 'swap': {
        const fc = await this._awaitEnemyCard('Выберите карту противника на поле');
        if (!fc) return null;
        targetInfo.targetCardId = fc.instanceId;
        const dc = await this._awaitEnemyDiscardCard('Выберите карту из сброса противника');
        if (!dc) return null;
        targetInfo.sourceCardId = dc.instanceId;
        break;
      }
      case 'double_trigger': {
        if (effect.target !== 'row') {
          const c = await this._awaitOwnFieldCard('Выберите карту для повтора эффекта');
          if (!c) return null;
          targetInfo.targetCardId = c.instanceId;
        }
        break;
      }
      case 'revive_buff': {
        const c = await this._awaitDiscardCard('Выберите карту из отбоя для воскрешения');
        if (!c) return null;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
    }
    return targetInfo;
  },

  // ── Target awaiting helpers ───────────────────────────────────────────────
  _awaitTarget(type, promptMsg) {
    return new Promise(resolve => {
      this.showToast(promptMsg || 'Выберите цель', 60000);
      this.awaitingTarget = { type, resolve };
    });
  },

  _awaitEnemyCard(msg)        { return this._awaitTarget('enemy_card', msg); },
  _awaitOwnFieldCard(msg)     { return this._awaitTarget('own_field_card', msg); },
  _awaitDiscardCard(msg)      { return this._awaitTarget('discard_card', msg); },
  _awaitEnemyDiscardCard(msg) { return this._awaitTarget('enemy_discard_card', msg); },

  _onEnemyCardClick(card) {
    if (this.awaitingTarget && ['enemy_card', 'any_card'].includes(this.awaitingTarget.type)) {
      this.awaitingTarget.resolve(card);
      this.awaitingTarget = null;
    }
  },

  _onOwnFieldCardClick(card) {
    if (this.awaitingTarget && ['own_field_card', 'any_card'].includes(this.awaitingTarget.type)) {
      this.awaitingTarget.resolve(card);
      this.awaitingTarget = null;
    }
  },

  _clearSelection() {
    this.selectedCard = null;
    document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
  },

  // ── Leader click ──────────────────────────────────────────────────────────
  async _onLeaderClick() {
    const state = this.client.state;
    if (!state?.myTurn) { this.showToast('Не ваш ход', 1000); return; }
    if (state.me?.leaderUsed) { this.showToast('Умение уже использовано', 1000); return; }

    const ability = state.me?.leader?.ability;
    if (!ability) return;

    let targetInfo = {};
    switch (ability.type) {
      case 'damage': {
        const c = await this._awaitEnemyCard('Выберите карту противника');
        if (!c) return;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'move_unit': {
        const c = await this._awaitOwnFieldCard('Выберите карту для перемещения');
        if (!c) return;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
      case 'returnToHand': {
        const c = await this._awaitDiscardCard('Выберите карту из отбоя');
        if (!c) return;
        targetInfo.targetCardId = c.instanceId;
        break;
      }
    }
    this.client.useLeader(targetInfo);
  },

  // ── Mulligan ──────────────────────────────────────────────────────────────
  renderMulligan(hand) {
    const el = document.getElementById('mulligan-hand');
    if (!el) return;
    el.innerHTML = '';
    const selected = new Set();

    hand.forEach(card => {
      const cardEl = this._createCardElement(card, 'hand', null, true);
      cardEl.onclick = () => {
        if (selected.has(card.id)) { selected.delete(card.id); cardEl.classList.remove('selected'); }
        else if (selected.size < 3) { selected.add(card.id); cardEl.classList.add('selected'); }
      };
      el.appendChild(cardEl);
    });

    document.getElementById('btn-mulligan-confirm').onclick = () => {
      this.client.mulligan([...selected]);
    };
  },

  // ── Discard viewer ────────────────────────────────────────────────────────
  showDiscard(cards, canPick = false, exclude = ['gold','special']) {
    const modal = document.getElementById('discard-modal');
    if (!modal) return;
    const list = document.getElementById('discard-list');
    list.innerHTML = '';
    const pickable = cards.filter(c => !exclude.includes(c.type));

    pickable.forEach(card => {
      const el = this._createCardElement(card, 'hand', null, canPick);
      if (canPick) {
        el.onclick = () => {
          if (this.awaitingTarget?.type === 'discard_card') {
            this.awaitingTarget.resolve(card);
            this.awaitingTarget = null;
            modal.style.display = 'none';
          }
        };
      }
      list.appendChild(el);
    });

    modal.style.display = 'flex';
    document.getElementById('discard-close').onclick = () => { modal.style.display = 'none'; };
  },

  // ── Reveal modal ──────────────────────────────────────────────────────────
  _showRevealModal(cards, canTake) {
    const modal = document.getElementById('reveal-modal');
    if (!modal) return;
    const list = document.getElementById('reveal-list');
    list.innerHTML = '';
    document.getElementById('reveal-title').textContent = canTake ? 'Выберите карту из колоды противника' : 'Карты из руки противника';

    cards.forEach(card => {
      const el = this._createCardElement(card, 'hand', null, canTake);
      if (canTake) {
        el.onclick = () => {
          this.client.takeRevealedCard(card.id || card.instanceId);
          modal.style.display = 'none';
        };
      }
      list.appendChild(el);
    });

    modal.style.display = 'flex';
    document.getElementById('reveal-close').onclick = () => { modal.style.display = 'none'; };
  },

  // ── Card detail ───────────────────────────────────────────────────────────
  _showCardDetail(card) {
    const modal = document.getElementById('card-detail-modal');
    if (!modal) return;
    document.getElementById('detail-name').textContent    = card.name;
    document.getElementById('detail-type').textContent    = card.type;
    document.getElementById('detail-power').textContent   = `Сила: ${card.currentPower ?? card.power}`;
    document.getElementById('detail-effect').textContent  = card.effect?.description || 'Нет эффекта';
    document.getElementById('detail-faction').textContent = card.faction || '';
    modal.style.display = 'flex';
    document.getElementById('detail-close').onclick = () => { modal.style.display = 'none'; };
  },

  // ── Event bindings ────────────────────────────────────────────────────────
  _bindEvents() {
    document.getElementById('btn-find-match')?.addEventListener('click', () => {
      if (!this.client.state) { this.showToast('Сначала выберите колоду'); return; }
      this.client.findMatch();
    });

    document.getElementById('btn-cancel-queue')?.addEventListener('click', () => {
      this.client.cancelQueue();
    });

    document.getElementById('btn-pass')?.addEventListener('click', () => {
      this.client.pass();
    });

    document.getElementById('btn-forfeit')?.addEventListener('click', () => {
      if (confirm('Сдаться?')) this.client.forfeit();
    });

    document.getElementById('btn-discard-me')?.addEventListener('click', () => {
      const st = this.client.state;
      this.showDiscard(st?.me?.discard || []);
    });

    document.getElementById('btn-discard-opp')?.addEventListener('click', () => {
      const st = this.client.state;
      this.showDiscard(st?.opponent?.discard || [], false);
    });

    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      this._showScreen('screen-main');
    });

    // Swipe up on hand container to expand
    let touchStartY = 0;
    const handEl = document.getElementById('hand-container');
    if (handEl) {
      handEl.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; });
      handEl.addEventListener('touchend', e => {
        const dy = touchStartY - e.changedTouches[0].clientY;
        if (dy > 50) handEl.classList.add('expanded');
        else if (dy < -30) handEl.classList.remove('expanded');
      });
    }

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.style.display = 'none'; });
    });
  }
};

// ── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  window.Telegram?.WebApp?.ready();
  window.Telegram?.WebApp?.expand();

  const client = new GameClient();
  UI.init(client);
  window.game = client;
  window.ui   = UI;
});