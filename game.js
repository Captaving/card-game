// ═══════════════════════════════════════════════════════════════════════
// LILY WARS — game.js
// Deck Builder · Animations · Game UI · Bot · WebSocket Client
// ═══════════════════════════════════════════════════════════════════════

'use strict';

const SERVER_URL = 'wss://lily-wars.duckdns.org/ws'; // ← замените

// ─── Card type colors ────────────────────────────────────────────────────────
const TYPE_COLORS = {
  white:   { bg:'#2a2a3e', border:'#555', power:'#fff' },
  gray:    { bg:'#2d3436', border:'#636e72', power:'#fff' },
  purple:  { bg:'#2d1b4e', border:'#9b59b6', power:'#d7bde2' },
  gold:    { bg:'#3d2b00', border:'#f1c40f', power:'#f1c40f' },
  special: { bg:'#3d0000', border:'#e74c3c', power:'#e74c3c' },
};
const FACTION_CSS = {
  knights: { primary:'#3498db', bg:'#1a3a5c', text:'#7ec8e3' },
  cultists:{ primary:'#7f8c8d', bg:'#1a1a2e', text:'#9b59b6' },
  dryads:  { primary:'#2ecc71', bg:'#1a3a2a', text:'#a8e6cf' },
  mages:   { primary:'#926eae', bg:'#2d1b4e', text:'#d7bde2' },
};
const TYPE_LABELS = {
  white:'Белый', gray:'Серый', purple:'Фиолетовый', gold:'Золотой', special:'Особая'
};
const ROW_LABELS = { left:'Левый', right:'Правый', any:'Любой', enemy_field:'Поле врага' };

// ═══════════════════════════════════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════
const Anim = {
  playCardIn(el) {
    el.classList.remove('anim-play-in');
    void el.offsetWidth;
    el.classList.add('anim-play-in');
    setTimeout(() => el.classList.remove('anim-play-in'), 500);
  },
  damage(el, amount) {
    if (!el) return;
    el.classList.remove('anim-damage');
    void el.offsetWidth;
    el.classList.add('anim-damage');
    setTimeout(() => el.classList.remove('anim-damage'), 550);
    Anim._floatNum(el, `-${amount}`, 'dmg');
  },
  buff(el, amount) {
    if (!el) return;
    el.classList.remove('anim-buff');
    void el.offsetWidth;
    el.classList.add('anim-buff');
    setTimeout(() => el.classList.remove('anim-buff'), 550);
    Anim._floatNum(el, `+${amount}`, 'buf');
  },
  death(el, cb) {
    if (!el) { cb?.(); return; }
    el.classList.add('anim-death');
    setTimeout(() => { el.remove(); cb?.(); }, 600);
  },
  appear(el) {
    el.classList.add('anim-appear');
    setTimeout(() => el.classList.remove('anim-appear'), 450);
  },
  _floatNum(el, text, cls) {
    const rect = el.getBoundingClientRect();
    const num  = document.createElement('div');
    num.className = `float-num ${cls}`;
    num.textContent = text;
    num.style.cssText = `left:${rect.left + rect.width/2}px;top:${rect.top}px;`;
    document.body.appendChild(num);
    setTimeout(() => num.remove(), 950);
  },
  shakeRow(rowEl) {
    if (!rowEl) return;
    rowEl.style.animation = 'none'; void rowEl.offsetWidth;
    rowEl.style.animation = 'shake-row .4s ease-out';
    setTimeout(() => rowEl.style.animation = '', 420);
  },
  toast(msg, duration = 2200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), duration);
  },
};

// ═══════════════════════════════════════════════════════════════════════
// CARD RENDERER
// ═══════════════════════════════════════════════════════════════════════
function makeCardEl(card, opts = {}) {
  const { interactive = false, context = 'field' } = opts;
  const tc  = TYPE_COLORS[card.type] || TYPE_COLORS.white;
  const pow = card.currentPower !== undefined ? card.currentPower : (card.power || 0);

  const el = document.createElement('div');
  el.className = `card card-${card.type}${interactive ? ' interactive' : ''}`;
  el.dataset.iid = card.instanceId || card.id;
  el.dataset.id  = card.id;

  el.innerHTML = `
    <div class="card-power">${pow}</div>
    <div class="card-name">${card.name}</div>
    ${card.effect ? `<div class="card-effect-dot">✦</div>` : ''}
    ${card.charges != null ? `<div class="card-charges">⚡${card.charges}</div>` : ''}
    ${card.cursed   ? `<div class="card-curse">☠</div>` : ''}
  `;
  if (card.type === 'gold') el.classList.add('anim-gold');

  // Long-press tooltip
  let pressTimer;
  el.addEventListener('touchstart', e => {
    pressTimer = setTimeout(() => showTooltip(card, e.touches[0].clientX, e.touches[0].clientY), 450);
  }, { passive: true });
  el.addEventListener('touchend',  () => { clearTimeout(pressTimer); hideTooltip(); });
  el.addEventListener('touchmove', () => clearTimeout(pressTimer));
  el.addEventListener('mouseenter', e => showTooltip(card, e.clientX, e.clientY));
  el.addEventListener('mouseleave', hideTooltip);

  return el;
}

function updateCardPower(iid, newPower) {
  const el = document.querySelector(`[data-iid="${iid}"] .card-power`);
  if (el) {
    el.textContent = newPower;
    el.style.animation = 'none'; void el.offsetWidth;
    el.style.animation = 'power-change .35s ease-out';
    setTimeout(() => el.style.animation = '', 380);
  }
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function showTooltip(card, x, y) {
  const el = document.getElementById('card-tooltip');
  const tc = TYPE_COLORS[card.type] || TYPE_COLORS.white;
  const pow = card.currentPower !== undefined ? card.currentPower : (card.power || 0);
  el.innerHTML = `
    <div class="tooltip-name">${card.name}</div>
    <div class="tooltip-row">
      <span class="tooltip-type-badge" style="background:${tc.border}22;color:${tc.border};border:1px solid ${tc.border}">${TYPE_LABELS[card.type]||card.type}</span>
      <span class="tooltip-power">${pow}</span>
      <span class="tooltip-influence">💡${card.influence}</span>
    </div>
    <div class="tooltip-line"></div>
    ${card.effect ? `<div class="tooltip-effect">${card.effect.description || ''}</div>` : '<div class="tooltip-effect" style="color:var(--dim)">Нет эффекта</div>'}
    <div class="tooltip-row-hint">Ряд: ${ROW_LABELS[card.row]||card.row} · Макс в колоде: ${card.maxInDeck||1}</div>
  `;
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = 220, h = 160;
  let lx = x + 12, ly = y - h / 2;
  if (lx + w > vw) lx = x - w - 12;
  if (ly < 8) ly = 8;
  if (ly + h > vh - 8) ly = vh - h - 8;
  el.style.left  = lx + 'px';
  el.style.top   = ly + 'px';
  el.style.display = 'block';
}
function hideTooltip() {
  document.getElementById('card-tooltip').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════════
// DECK BUILDER
// ═══════════════════════════════════════════════════════════════════════
const DB = {
  faction: 'knights',
  leaderIdx: 0,
  deck: [],          // array of card objects (may have duplicates)
  filter: 'all',
  savedDeck: null,   // { deck, faction, leader } persisted to localStorage

  init() {
    this._buildFactionTabs();
    this._bindFilters();
    document.getElementById('db-clear').onclick = () => { this.deck = []; this._renderDeck(); this._renderPool(); };
    document.getElementById('db-save').onclick  = () => this._save();
    document.getElementById('db-back').onclick  = () => showScreen('screen-main');
    this._load();
    this._selectFaction('knights');
  },

  open() {
    this._selectFaction(this.faction);
    showScreen('screen-deck');
  },

  _buildFactionTabs() {
    const ct = document.getElementById('db-faction-tabs');
    ct.innerHTML = '';
    Object.values(FACTIONS).forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'db-faction-tab';
      btn.textContent = f.name;
      btn.dataset.fid = f.id;
      btn.style.setProperty('--fc', f.color);
      btn.onclick = () => this._selectFaction(f.id);
      ct.appendChild(btn);
    });
  },

  _selectFaction(fid) {
    this.faction = fid;
    // If switching faction, reset deck
    if (this.deck.length > 0 && this.deck[0].id.split('_')[0] !== fid) {
      this.deck = [];
    }
    document.querySelectorAll('.db-faction-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.fid === fid);
    });
    const fc = FACTION_CSS[fid] || FACTION_CSS.knights;
    document.documentElement.style.setProperty('--f-primary', fc.primary);
    this._renderLeaders();
    this._renderPool();
    this._renderDeck();
  },

  _renderLeaders() {
    const ct = document.getElementById('db-leaders');
    ct.innerHTML = '';
    const leaders = FACTIONS[this.faction]?.leaders || [];
    leaders.forEach((l, i) => {
      const btn = document.createElement('button');
      btn.className = `db-leader-btn${i === this.leaderIdx ? ' selected' : ''}`;
      btn.innerHTML = `<div class="db-leader-name">${l.name}</div><div class="db-leader-desc">${l.ability?.description || ''}</div>`;
      btn.onclick = () => {
        this.leaderIdx = i;
        document.querySelectorAll('.db-leader-btn').forEach((b,j) => b.classList.toggle('selected', j === i));
      };
      ct.appendChild(btn);
    });
  },

  _bindFilters() {
    document.getElementById('db-filters').addEventListener('click', e => {
      const btn = e.target.closest('.db-filter-btn');
      if (!btn) return;
      this.filter = btn.dataset.filter;
      document.querySelectorAll('.db-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      this._renderPool();
    });
  },

  _renderPool() {
    const ct  = document.getElementById('db-pool');
    ct.innerHTML = '';
    const cards = FACTIONS[this.faction]?.cards || [];
    const counts = this._deckCounts();
    const seen = new Set();

    cards.forEach(card => {
      if (seen.has(card.name + card.type)) return; // show unique names once
      seen.add(card.name + card.type);
      if (this.filter !== 'all' && card.type !== this.filter) return;

      const inDeck   = counts[card.name] || 0;
      const maxCopies = card.maxInDeck || 1;
      const maxed    = inDeck >= maxCopies;
      const tc       = TYPE_COLORS[card.type] || TYPE_COLORS.white;

      const row = document.createElement('div');
      row.className = `db-card-row${inDeck > 0 ? ' in-deck' : ''}${maxed ? ' maxed' : ''}`;
      row.innerHTML = `
        <div class="db-row-mini" style="background:${tc.bg};border-color:${tc.border};color:${tc.power}">${card.power||0}</div>
        <div class="db-row-info">
          <div class="db-row-name">${card.name}</div>
          <div class="db-row-meta">${TYPE_LABELS[card.type]||card.type} · ${ROW_LABELS[card.row]||card.row} · ${inDeck}/${maxCopies}</div>
          ${card.effect ? `<div class="db-row-effect">${card.effect.description||''}</div>` : ''}
        </div>
        <div class="db-row-infl">💡${card.influence}</div>
        <button class="db-row-add" title="Добавить">+</button>
      `;

      const addBtn = row.querySelector('.db-row-add');
      addBtn.onclick = e => { e.stopPropagation(); this._addCard(card); };

      // Show tooltip on long press / hover
      let pt;
      row.addEventListener('mouseenter', ev => showTooltip(card, ev.clientX, ev.clientY));
      row.addEventListener('mouseleave', hideTooltip);
      row.addEventListener('touchstart', ev => { pt = setTimeout(() => showTooltip(card, ev.touches[0].clientX, ev.touches[0].clientY), 450); }, { passive:true });
      row.addEventListener('touchend', () => { clearTimeout(pt); hideTooltip(); });

      ct.appendChild(row);
    });
  },

  _renderDeck() {
    const counts = this._deckCounts();
    const total  = this.deck.length;
    const inf    = this.deck.reduce((s, c) => s + (c.influence || 0), 0);

    document.getElementById('db-count').textContent = total;
    const infEl = document.getElementById('db-influence');
    infEl.textContent = `Влияние: ${inf}/170`;
    infEl.classList.toggle('over', inf > 170);

    const saveBtn = document.getElementById('db-save');
    saveBtn.disabled = total !== 25 || inf > 170 || !FACTIONS[this.faction]?.leaders[this.leaderIdx];

    const ct = document.getElementById('db-deck-list');
    ct.innerHTML = '';

    // Group by name
    const grouped = {};
    this.deck.forEach(c => { grouped[c.name] = grouped[c.name] || { card: c, count: 0 }; grouped[c.name].count++; });

    Object.values(grouped).sort((a, b) => (b.card.power || 0) - (a.card.power || 0)).forEach(({ card, count }) => {
      const item = document.createElement('div');
      item.className = 'db-deck-item';
      item.innerHTML = `
        <span class="db-deck-item-power">${card.power||0}</span>
        <span class="db-deck-item-name">${card.name}</span>
        <span class="db-deck-item-count">x${count}</span>
      `;
      item.onclick = () => this._removeCard(card.name);
      ct.appendChild(item);
    });
  },

  _deckCounts() {
    const c = {};
    this.deck.forEach(card => { c[card.name] = (c[card.name] || 0) + 1; });
    return c;
  },

  _addCard(cardTemplate) {
    if (this.deck.length >= 25) { Anim.toast('Колода заполнена (25 карт)'); return; }
    const counts = this._deckCounts();
    if ((counts[cardTemplate.name] || 0) >= (cardTemplate.maxInDeck || 1)) {
      Anim.toast(`Макс копий: ${cardTemplate.maxInDeck}`); return;
    }
    const inf = this.deck.reduce((s,c) => s + (c.influence||0), 0) + (cardTemplate.influence||0);
    if (inf > 170) { Anim.toast('Превышено влияние (170)'); return; }

    // Find exact card object from faction cards
    const pool  = FACTIONS[this.faction]?.cards || [];
    const added = this.deck.filter(c => c.name === cardTemplate.name).length;
    const pool2 = pool.filter(c => c.name === cardTemplate.name);
    const toAdd = pool2[added] || cardTemplate;
    this.deck.push({ ...toAdd });
    this._renderDeck();
    this._renderPool();
  },

  _removeCard(name) {
    const idx = this.deck.findLastIndex(c => c.name === name);
    if (idx !== -1) { this.deck.splice(idx, 1); this._renderDeck(); this._renderPool(); }
  },

  _save() {
    const leader = FACTIONS[this.faction]?.leaders[this.leaderIdx];
    if (!leader) return;
    const saved = { deck: this.deck, faction: this.faction, leader };
    try { localStorage.setItem('lilyDeck', JSON.stringify(saved)); } catch {}
    this.savedDeck = saved;
    Anim.toast('✅ Колода сохранена!', 2000);
    showScreen('screen-main');
  },

  _load() {
    try {
      const raw = localStorage.getItem('lilyDeck');
      if (raw) {
        this.savedDeck = JSON.parse(raw);
        if (this.savedDeck) {
          this.faction   = this.savedDeck.faction || 'knights';
          this.deck      = this.savedDeck.deck    || [];
          const leaders  = FACTIONS[this.faction]?.leaders || [];
          this.leaderIdx = leaders.findIndex(l => l.id === this.savedDeck.leader?.id) || 0;
        }
      }
    } catch {}
  },

  getSaved() { return this.savedDeck; },
};

// ═══════════════════════════════════════════════════════════════════════
// SCREEN MANAGER
// ═══════════════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function applyFactionTheme(fid) {
  const fc = FACTION_CSS[fid] || FACTION_CSS.knights;
  document.documentElement.style.setProperty('--f-primary', fc.primary);
  document.documentElement.style.setProperty('--f-bg',      fc.bg);
  document.documentElement.style.setProperty('--f-text',    fc.text);
}

// ═══════════════════════════════════════════════════════════════════════
// GAME UI
// ═══════════════════════════════════════════════════════════════════════
const GameUI = {
  state:          null,
  myRole:         null,   // 'player1' | 'player2'
  selectedCard:   null,
  awaitTarget:    null,   // { type, resolve, reject }
  prevFields:     {},     // track field changes for animation

  render(state, myRole) {
    this.state  = state;
    this.myRole = myRole;
    if (!state.me) return;

    applyFactionTheme(state.me.faction || 'knights');

    const { me, opponent } = state;

    // Header
    el('round-display').textContent   = `РАУНД ${state.round} / 3`;
    el('score-me').textContent        = me.score;
    el('score-opp').textContent       = opponent.score;
    el('coins-me').textContent        = '⬡'.repeat(me.coins);
    el('coins-opp').textContent       = '⬡'.repeat(opponent.coins);
    el('opp-name').textContent        = opponent.name || 'Соперник';
    el('opp-deck-count').textContent  = opponent.deck;
    el('opp-hand-count').textContent  = opponent.handCount;
    el('opp-discard-count').textContent = (opponent.discard||[]).length;
    el('my-deck-count').textContent   = me.deck;
    el('my-discard-count').textContent= (me.discard||[]).length;

    const turnEl = el('turn-indicator');
    turnEl.textContent  = state.myTurn ? '← Ваш ход' : 'Ход противника →';
    turnEl.className    = `turn-indicator ${state.myTurn ? 'my-turn' : 'opp-turn'}`;

    const passBtn = el('btn-pass');
    passBtn.disabled  = !state.myTurn || me.passed;
    passBtn.textContent = me.passed ? '✓ Спасовал' : 'ПАС';

    this._renderLeader('leader-me',  me.leader,       me.leaderUsed,       false, me.leaderCharges);
    this._renderLeader('leader-opp', opponent.leader, opponent.leaderUsed, true);

    // Fields
    this._renderField('field-opp-left',  opponent.field?.left  || [], 'enemy', 'left');
    this._renderField('field-opp-right', opponent.field?.right || [], 'enemy', 'right');
    this._renderField('field-me-left',   me.field?.left        || [], 'own',   'left');
    this._renderField('field-me-right',  me.field?.right       || [], 'own',   'right');

    this._setRowScore('rs-opp-left',  opponent.field?.left  || []);
    this._setRowScore('rs-opp-right', opponent.field?.right || []);
    this._setRowScore('rs-me-left',   me.field?.left        || []);
    this._setRowScore('rs-me-right',  me.field?.right       || []);

    this._renderHand(me.hand || [], state.myTurn && !me.passed);

    // Log
    if (state.log?.length) {
      el('log-strip').textContent = state.log[state.log.length - 1] || '';
    }

    // Drop zone highlights
    this._updateDropZones();
  },

  _renderLeader(containerId, leader, used, isOpp, charges) {
    const ct = el(containerId);
    if (!ct || !leader) return;
    ct.innerHTML = '';
    const btn = document.createElement('div');
    btn.className = `leader-icon${used ? ' used' : ''}${isOpp ? ' opponent' : ''}`;
    const shortName = leader.name.split(' ').pop();
    btn.innerHTML = `<div class="leader-name">${shortName}</div>`;
    if (charges != null) btn.innerHTML += `<div class="leader-charges">${charges}</div>`;
    if (!isOpp) {
      btn.onclick = () => {
        if (!this.state?.myTurn) { Anim.toast('Не ваш ход'); return; }
        showTooltip(leader, btn.getBoundingClientRect().left, btn.getBoundingClientRect().top);
        if (!used) Game.onLeaderClick();
      };
    } else {
      btn.onclick = () => showTooltip(
        { name: leader.name, type:'gold', effect:{ description: leader.ability?.description||'' } },
        btn.getBoundingClientRect().left, btn.getBoundingClientRect().top
      );
    }
    ct.appendChild(btn);
  },

  _renderField(containerId, cards, side, row) {
    const ct = el(containerId);
    if (!ct) return;

    const prevIds = new Set([...ct.querySelectorAll('.card')].map(c => c.dataset.iid));
    const newIds  = new Set(cards.map(c => c.instanceId));

    // Remove dead cards with animation
    for (const cardEl of [...ct.querySelectorAll('.card')]) {
      if (!newIds.has(cardEl.dataset.iid)) {
        Anim.death(cardEl);
      }
    }

    // Add new cards with animation
    for (const card of cards) {
      const existing = ct.querySelector(`[data-iid="${card.instanceId}"]`);
      if (existing) {
        // Update power display
        const pwEl = existing.querySelector('.card-power');
        const prev = parseInt(pwEl.textContent);
        if (prev !== card.currentPower) {
          pwEl.textContent = card.currentPower;
          if (card.currentPower > prev) Anim.buff(existing, card.currentPower - prev);
          else Anim.damage(existing, prev - card.currentPower);
        }
        // Update charges
        const chEl = existing.querySelector('.card-charges');
        if (chEl && card.charges != null) chEl.textContent = `⚡${card.charges}`;
      } else {
        const cardEl = makeCardEl(card, { interactive: side === 'own', context: 'field' });
        if (side === 'enemy') {
          cardEl.onclick = () => this._onEnemyCardClick(card);
        } else {
          cardEl.onclick = () => this._onOwnFieldCardClick(card);
        }
        ct.appendChild(cardEl);
        Anim.appear(cardEl);
      }
    }
  },

  _setRowScore(id, cards) {
    const total = cards.reduce((s, c) => s + (c.currentPower || 0), 0);
    const sc = el(id);
    if (sc) sc.textContent = total;
  },

  _renderHand(cards, interactive) {
    const ct = el('hand-container');
    if (!ct) return;
    ct.innerHTML = '';
    cards.forEach((card, i) => {
      const cardEl = makeCardEl(card, { interactive, context: 'hand' });
      cardEl.style.setProperty('--idx', i);
      if (interactive) {
        cardEl.onclick = e => { e.stopPropagation(); this._onHandCardClick(card, cardEl); };
      }
      ct.appendChild(cardEl);
    });
  },

  _updateDropZones() {
    const hasSelected = !!this.selectedCard;
    ['frow-me-left', 'frow-me-right'].forEach(id => {
      el(id)?.classList.toggle('highlight', hasSelected);
    });
  },

  // ─── Interaction ──────────────────────────────────────────────────────────
  _onHandCardClick(card, cardEl) {
    // If waiting for target selection
    if (this.awaitTarget?.type === 'discard_card') {
      this.awaitTarget.resolve(card); this.awaitTarget = null; return;
    }
    if (this.selectedCard?.instanceId === card.instanceId) {
      this._clearSelection(); return;
    }
    this._clearSelection();
    this.selectedCard = card;
    cardEl.classList.add('selected');
    this._updateDropZones();
    this._triggerPlay(card);
  },

  async _triggerPlay(card) {
    const row = card.row;
    let targetRow;

    if (card.type === 'special' || row === 'any') {
      targetRow = await this._pickRow();
      if (!targetRow) { this._clearSelection(); return; }
    } else {
      targetRow = row;
    }

    const targetInfo = await this._gatherTargets(card, targetRow);
    if (targetInfo === null) { this._clearSelection(); return; }

    this._clearSelection();
    Game.playCard(card.id || card.instanceId, targetRow, targetInfo);
  },

  async _gatherTargets(card, row) {
    if (!card.effect || card.effect.type === 'passive') return { row };
    const e  = card.effect;
    const ti = { row };
    const state = this.state;
    if (!state) return ti;

    const me    = state.me;
    const opp   = state.opponent;
    const myCards  = [...(me.field?.left||[]), ...(me.field?.right||[])];
    const oppCards = [...(opp.field?.left||[]), ...(opp.field?.right||[])];

    try {
      switch (e.action) {
        case 'buff':
          if (e.target === 'own_unit_selectable' && myCards.length) {
            const t = await this._pickTarget(myCards, '✨ Выберите карту для усиления', 'ally');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          } else if (e.count && myCards.length) {
            const ids = [];
            for (let i = 0; i < Math.min(e.count, myCards.length); i++) {
              Anim.toast(`Выберите карту ${i+1} из ${e.count}`);
              const t = await this._pickTarget(myCards.filter(c => !ids.includes(c.instanceId)), 'Выберите', 'ally');
              if (!t) return null;
              ids.push(t.instanceId);
            }
            ti.targetCardIds = ids;
          }
          break;
        case 'damage':
          if (e.target?.includes('selectable') && oppCards.length) {
            const t = await this._pickTarget(oppCards, '🎯 Выберите карту противника', 'enemy');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          } else if (e.target === 'any_unit_selectable') {
            const all = [...myCards, ...oppCards];
            if (all.length) {
              const t = await this._pickTarget(all, '🎯 Выберите любую карту', 'any');
              if (!t) return null;
              ti.targetCardId = t.instanceId;
            }
          }
          break;
        case 'steal':
          if (oppCards.length) {
            const t = await this._pickTarget(oppCards, '🫴 Выберите карту противника', 'enemy');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        case 'trap':
          if (e.trigger === 'enemy_buff' && oppCards.length) {
            const t = await this._pickTarget(oppCards, '🪤 Поставить ловушку на карту', 'enemy');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        case 'curse':
          if (oppCards.length) {
            const t = await this._pickTarget(oppCards, '☠️ Выберите цель проклятия', 'enemy');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        case 'returnToHand':
          if (myCards.length) {
            const t = await this._pickTarget(myCards, '↩️ Выберите карту для возврата', 'ally');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        case 'revive':
        case 'revive_buff': {
          const disc = (me.discard||[]).filter(c => c.type !== 'gold' && c.type !== 'special');
          if (disc.length) {
            const t = await this._pickTarget(disc, '💀 Выберите карту из отбоя', 'ally');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        }
        case 'destroy':
          if (e.target === 'own_unit_selectable' && myCards.length) {
            const t = await this._pickTarget(myCards, '💥 Уничтожить свою карту', 'ally');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          } else if (e.target?.includes('enemy') && oppCards.length) {
            const pool = e.target === 'any_enemy_not_gold'
              ? oppCards.filter(c => c.type !== 'gold') : oppCards;
            if (pool.length) {
              const t = await this._pickTarget(pool, '💥 Уничтожить карту противника', 'enemy');
              if (!t) return null;
              ti.targetCardId = t.instanceId;
            }
          } else if (e.target === 'any_unit_selectable') {
            const all = [...myCards, ...oppCards];
            const t = await this._pickTarget(all, '💥 Выберите любую карту', 'any');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        case 'consume':
        case 'consume_buff':
          if (myCards.length) {
            const pool = myCards.filter(c => c.name !== 'Чернокнижник');
            if (pool.length) {
              const t = await this._pickTarget(pool, '🔥 Пожертвовать карту', 'ally');
              if (!t) return null;
              ti.targetCardId = t.instanceId;
            }
          }
          break;
        case 'transform':
          if (myCards.length) {
            const t = await this._pickTarget(myCards, '🔄 Трансформировать карту', 'ally');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        case 'move_row':
          if (e.target === 'enemy_unit_selectable' && oppCards.length) {
            const t = await this._pickTarget(oppCards, '↔️ Переместить карту противника', 'enemy');
            if (!t) return null;
            ti.targetCardId = t.instanceId;
          }
          break;
        case 'swap':
          if (oppCards.length && (opp.discard||[]).length) {
            const t1 = await this._pickTarget(oppCards, '🔄 Карта на поле противника', 'enemy');
            if (!t1) return null;
            ti.targetCardId = t1.instanceId;
            const t2 = await this._pickTarget(opp.discard, '🔄 Карта из отбоя противника', 'any');
            if (!t2) return null;
            ti.sourceCardId = t2.instanceId;
          }
          break;
        case 'double_trigger':
          if (e.target !== 'row' && myCards.length) {
            const pool = myCards.filter(c => c.effect?.type === 'onPlay');
            if (pool.length) {
              const t = await this._pickTarget(pool, '🔁 Повторить эффект карты', 'ally');
              if (!t) return null;
              ti.targetCardId = t.instanceId;
            }
          }
          break;
      }
    } catch { return null; }

    return ti;
  },

  // Pick from a modal list
  _pickTarget(cards, title, style) {
    return new Promise((resolve, reject) => {
      if (!cards.length) { resolve(null); return; }

      const modal = el('modal-target');
      const list  = el('target-list');
      el('target-modal-title').textContent = title;
      list.innerHTML = '';

      const cleanup = () => { modal.style.display = 'none'; };

      cards.forEach(card => {
        const cardEl = makeCardEl(card, { interactive: true });
        if (style === 'enemy')  cardEl.classList.add('targeting');
        if (style === 'ally')   cardEl.classList.add('ally-target');
        cardEl.onclick = () => { cleanup(); resolve(card); };
        list.appendChild(cardEl);
      });

      el('target-cancel').onclick = () => { cleanup(); resolve(null); };
      modal.onclick = e => { if (e.target === modal) { cleanup(); resolve(null); } };
      modal.style.display = 'flex';
    });
  },

  _pickRow() {
    return new Promise(resolve => {
      const modal = el('modal-row');
      modal.style.display = 'flex';
      el('row-btn-left').onclick  = () => { modal.style.display = 'none'; resolve('left'); };
      el('row-btn-right').onclick = () => { modal.style.display = 'none'; resolve('right'); };
      modal.onclick = e => { if (e.target === modal) { modal.style.display = 'none'; resolve(null); } };
    });
  },

  _onEnemyCardClick(card) {
    if (this.awaitTarget && ['enemy_card','any'].includes(this.awaitTarget.type)) {
      this.awaitTarget.resolve(card); this.awaitTarget = null;
    }
  },

  _onOwnFieldCardClick(card) {
    if (this.awaitTarget?.type === 'own_field_card') {
      this.awaitTarget.resolve(card); this.awaitTarget = null;
    }
  },

  _clearSelection() {
    this.selectedCard = null;
    document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
    this._updateDropZones();
  },

  // Discard viewer
  showDiscard(cards, canPick = false, title = 'Отбой') {
    el('discard-modal-title').textContent = title;
    const list = el('discard-list');
    list.innerHTML = '';
    const pickable = cards.filter(c => c.type !== 'special');
    (canPick ? pickable : cards).forEach(card => {
      const cardEl = makeCardEl(card, { interactive: canPick });
      if (canPick) {
        cardEl.onclick = () => {
          el('modal-discard').style.display = 'none';
          if (this.awaitTarget?.type === 'discard_card') {
            this.awaitTarget.resolve(card); this.awaitTarget = null;
          }
        };
      }
      list.appendChild(cardEl);
    });
    el('modal-discard').style.display = 'flex';
    el('discard-close').onclick = () => { el('modal-discard').style.display = 'none'; };
  },

  showReveal(cards, canTake, title) {
    el('reveal-modal-title').textContent = title || 'Карты противника';
    const list = el('reveal-list');
    list.innerHTML = '';
    cards.forEach(card => {
      const cardEl = makeCardEl(card, { interactive: canTake });
      if (canTake) cardEl.onclick = () => {
        el('modal-reveal').style.display = 'none';
        Game.ws?.send && Game.ws.readyState === 1 && Game.ws.send(
          JSON.stringify({ type: 'take_revealed_card', cardId: card.id || card.instanceId })
        );
      };
      list.appendChild(cardEl);
    });
    el('modal-reveal').style.display = 'flex';
    el('reveal-close').onclick = () => { el('modal-reveal').style.display = 'none'; };
  },

  renderMulligan(hand, opponentName) {
    el('match-opponent').textContent = `vs ${opponentName || 'Соперник'}`;
    const ct = el('mulligan-hand');
    ct.innerHTML = '';
    const selected = new Set();

    hand.forEach(card => {
      const cardEl = makeCardEl(card, { interactive: true, context: 'mulligan' });
      cardEl.onclick = () => {
        if (selected.has(card.instanceId || card.id)) {
          selected.delete(card.instanceId || card.id);
          cardEl.classList.remove('selected');
        } else if (selected.size < 3) {
          selected.add(card.instanceId || card.id);
          cardEl.classList.add('selected');
        }
      };
      ct.appendChild(cardEl);
    });

    el('btn-mulligan-confirm').onclick = () => {
      Game.mulligan([...selected]);
    };
    showScreen('screen-mulligan');
  },

  showGameOver(msg, myPid) {
    const won = msg.winner === myPid;
    el('gameover-title').textContent = won ? '🏆 Победа!' : msg.winner ? '💀 Поражение' : '🤝 Ничья';
    el('gameover-title').style.color = won ? 'var(--gold)' : msg.winner ? 'var(--red)' : 'var(--dim)';
    const c = msg.coins || {};
    el('gameover-coins').textContent = `${c[myPid]||0} ⬡ vs ⬡ ${c[msg.winner === myPid ? (myPid === 'p1' ? 'p2' : 'p1') : msg.winner]||0}`;
    el('gameover-reason').textContent = msg.reason === 'forfeit' ? '(сдался)' : msg.reason === 'disconnect' ? '(отключился)' : '';
    const myRating = msg.ratings?.[myPid];
    el('gameover-rating').textContent = myRating ? `Рейтинг: ${myRating.rating} (W:${myRating.wins} L:${myRating.losses})` : '';
    showScreen('screen-gameover');
  },
};

// helper
function el(id) { return document.getElementById(id); }

// ═══════════════════════════════════════════════════════════════════════
// GAME CONTROLLER (WebSocket client)
// ═══════════════════════════════════════════════════════════════════════
const Game = {
  ws:      null,
  myPid:   null,
  myRole:  null,
  rating:  1000,
  _reconnTimer: null,

  init() {
    this._connect();
    this._bindUI();
  },

  _connect() {
    try { this.ws = new WebSocket(SERVER_URL); }
    catch { this._scheduleReconnect(); return; }

    this.ws.onopen    = () => this._onOpen();
    this.ws.onmessage = e => this._onMessage(JSON.parse(e.data));
    this.ws.onclose   = () => this._scheduleReconnect();
    this.ws.onerror   = () => {};
  },

  _scheduleReconnect() {
    clearTimeout(this._reconnTimer);
    this._reconnTimer = setTimeout(() => this._connect(), 3000);
  },

  _send(type, payload = {}) {
    if (this.ws?.readyState === 1)
      this.ws.send(JSON.stringify({ type, ...payload }));
  },

  _onOpen() {
    clearTimeout(this._reconnTimer);
    const tg   = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const tgId = tg?.id || 'guest_' + Math.random().toString(36).slice(2);
    const name = tg ? `${tg.first_name} ${tg.last_name||''}`.trim() : 'Player';
    this._send('auth', { tgId, name });
  },

  _onMessage(msg) {
    switch (msg.type) {
      case 'connected':   this.myPid = msg.socketId; break;
      case 'auth_ok':
        this.rating = msg.rating;
        el('player-rating').textContent = `Рейтинг: ${msg.rating}`;
        break;
      case 'deck_ok':     Anim.toast('Колода принята ✓'); break;
      case 'in_queue':    el('queue-status').textContent = `Поиск... (в очереди: ${msg.position})`; break;
      case 'queue_cancelled': showScreen('screen-main'); break;
      case 'match_found':
        this.myRole = msg.yourRole;
        break;
      case 'game_state':
        GameUI.render(msg, this.myRole);
        if (msg.phase === 'mulligan' && msg.me?.hand) {
          GameUI.renderMulligan(msg.me.hand, msg.opponent?.name);
        } else if (msg.phase === 'play' || msg.phase === 'gameOver') {
          showScreen('screen-game');
        }
        break;
      case 'game_start':  showScreen('screen-game'); break;
      case 'mulligan_done': el('mulligan-status').textContent = 'Ожидание противника...'; break;
      case 'round_end': {
        const won = msg.roundWinner === this.myPid;
        const draw = !msg.roundWinner;
        Anim.toast(draw ? '🤝 Раунд — ничья' : won ? '⭐ Раунд выигран!' : '💀 Раунд проигран', 2500);
        break;
      }
      case 'game_over':   GameUI.showGameOver(msg, this.myPid); break;
      case 'player_passed':
        Anim.toast(msg.pid === this.myPid ? 'Вы спасовали' : 'Противник спасовал', 1800);
        break;
      case 'card_added_to_hand': Anim.toast(`📥 Получена карта: ${msg.card.name}`, 2000); break;
      case 'reveal_cards': GameUI.showReveal(msg.cards, false, 'Карты противника'); break;
      case 'reveal_choose': GameUI.showReveal(msg.cards, true, 'Выберите карту из колоды'); break;
      case 'error':        Anim.toast('⚠️ ' + msg.message); break;
    }
  },

  // ─── Actions ──────────────────────────────────────────────────────────────
  setDeck() {
    const saved = DB.getSaved();
    if (!saved) { Anim.toast('Сначала соберите колоду'); return false; }
    this._send('set_deck', { deck: saved.deck, faction: saved.faction, leader: saved.leader });
    return true;
  },

  findMatch() {
    if (!this.setDeck()) return;
    if (!this.ws || this.ws.readyState !== 1) {
      Anim.toast('⚠️ Нет соединения с сервером. Повтор...', 2000);
      setTimeout(() => this.findMatch(), 2500);
      return;
    }
    this._send('find_match');
    showScreen('screen-queue');
  },

  cancelQueue() { this._send('cancel_queue'); },

  mulligan(cardIds) {
    this._send('mulligan', { cardIds });
    el('mulligan-status').textContent = 'Ожидание противника...';
    el('btn-mulligan-confirm').disabled = true;
  },

  playCard(cardId, row, targetInfo) {
    this._send('play_card', { cardId, row, targetInfo });
  },

  pass() { this._send('pass'); },

  onLeaderClick() {
    // Leader needs target info based on ability
    const state = GameUI.state;
    if (!state?.myTurn) return;
    const ability = state.me?.leader?.ability;
    if (!ability) return;
    this._doLeaderAction(ability, state);
  },

  async _doLeaderAction(ability, state) {
    let targetInfo = {};
    const oppCards = [...(state.opponent?.field?.left||[]), ...(state.opponent?.field?.right||[])];
    const myCards  = [...(state.me?.field?.left||[]),       ...(state.me?.field?.right||[])];
    const myDiscard = state.me?.discard || [];

    try {
      switch (ability.type) {
        case 'damage': {
          if (oppCards.length) {
            const t = await GameUI._pickTarget(oppCards, '🎯 Выберите цель лидера', 'enemy');
            if (!t) return;
            targetInfo.targetCardId = t.instanceId;
          }
          break;
        }
        case 'move_unit': {
          if (myCards.length) {
            const t = await GameUI._pickTarget(myCards, '↔️ Переместить карту', 'ally');
            if (!t) return;
            targetInfo.targetCardId = t.instanceId;
          }
          break;
        }
        case 'returnToHand': {
          if (myDiscard.length) {
            const disc = myDiscard.filter(c => c.type !== 'gold');
            const t = await GameUI._pickTarget(disc, '↩️ Вернуть из отбоя', 'ally');
            if (!t) return;
            targetInfo.targetCardId = t.instanceId;
          }
          break;
        }
      }
    } catch { return; }

    this._send('use_leader', { targetInfo });
  },

  forfeit() {
    if (confirm('Сдаться? -2 к рейтингу.')) this._send('forfeit');
  },

  init() {
    this._connect();
    this._bindUI();
  },

  // ─── UI bindings ──────────────────────────────────────────────────────────
  _bindUI() {
    // Игровые кнопки (не главное меню — они биндятся в boot)
    el('btn-pass')?.addEventListener('click', () => this.pass());
    el('btn-forfeit')?.addEventListener('click', () => this.forfeit());

    // Discard viewers
    el('my-discard-btn')?.addEventListener('click', () => {
      const disc = GameUI.state?.me?.discard || [];
      GameUI.showDiscard(disc, false, 'Мой отбой');
    });
    el('opp-discard-btn')?.addEventListener('click', () => {
      const disc = GameUI.state?.opponent?.discard || [];
      GameUI.showDiscard(disc, false, 'Отбой противника');
    });

    // Swipe up on hand
    const handEl = el('hand-container');
    if (handEl) {
      let ty0 = 0;
      handEl.addEventListener('touchstart', e => { ty0 = e.touches[0].clientY; }, { passive:true });
      handEl.addEventListener('touchend', e => {
        const dy = ty0 - e.changedTouches[0].clientY;
        if (dy > 40)  handEl.classList.add('expanded');
        if (dy < -30) handEl.classList.remove('expanded');
      });
    }

    // Field row click = play selected card
    ['frow-me-left','frow-me-right'].forEach(rowId => {
      el(rowId)?.addEventListener('click', e => {
        const rowEl = el(rowId);
        if (!rowEl) return;
        if (e.target !== rowEl && !rowEl.querySelector('.row-label')?.contains(e.target)) return;
        if (!GameUI.selectedCard) return;
        const row = rowId.includes('left') ? 'left' : 'right';
        GameUI._triggerPlay.call(GameUI, { ...GameUI.selectedCard, row });
      });
    });

    // Hide tooltip on tap elsewhere
    document.addEventListener('touchstart', () => hideTooltip());
  },

  // ─── Bot picker ───────────────────────────────────────────────────────────
  _showBotPicker(saved) {
    const ct = el('bot-faction-list');
    ct.innerHTML = '';
    Object.values(FACTIONS).forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'db-leader-btn';
      btn.style.borderColor = f.color;
      btn.innerHTML = `<div class="db-leader-name" style="color:${f.color}">${f.name}</div>`;
      btn.onclick = () => {
        el('modal-bot').style.display = 'none';
        BotGame.start(saved, f.id);
      };
      ct.appendChild(btn);
    });
    el('bot-cancel').onclick = () => { el('modal-bot').style.display = 'none'; };
    el('modal-bot').style.display = 'flex';
  },
};

// ═══════════════════════════════════════════════════════════════════════
// BOT AI
// ═══════════════════════════════════════════════════════════════════════
const BotAI = {
  decideMulligan(hand) {
    return hand.filter(c => (c.power||0) <= 2 && c.type !== 'gold').slice(0,2).map(c => c.instanceId);
  },

  decide(hand, myField, oppField, myScore, oppScore, round, leaderUsed) {
    if (hand.length === 0) return { action: 'pass' };

    const myTotal  = this._score(myField);
    const oppTotal = this._score(oppField);
    const advantage = myTotal - oppTotal;

    if (advantage >= 15 && round >= 2) return { action: 'pass' };
    if (advantage >= 8 && hand.length <= 3 && round === 3) return { action: 'pass' };

    const scored = hand.map(c => ({ card: c, val: this._scoreCard(c, myField, oppField, round) }));
    scored.sort((a,b) => b.val - a.val);
    const best = scored[0].card;
    const row  = best.row !== 'any' ? best.row :
      ((myField.left||[]).length <= (myField.right||[]).length ? 'left' : 'right');

    return { action: 'play', card: best, row, targets: this._targets(best, myField, oppField) };
  },

  _score(field) {
    return [...(field.left||[]),...(field.right||[])].reduce((s,c) => s+(c.currentPower||0), 0);
  },

  _scoreCard(card, myField, oppField, round) {
    let v = card.power || 0;
    const e = card.effect;
    if (e) {
      if (e.action === 'damage')        v += (e.value||0) * 1.5;
      if (e.action === 'buff')          v += (e.value||0) * 1.2;
      if (e.action === 'steal')         v += 8;
      if (e.action === 'destroy')       v += 10;
      if (e.action === 'curse')         v += 6;
      if (e.action === 'revive')        v += 7;
    }
    if (card.type === 'gold')    v += 5;
    if (round === 3)             v *= 1.2;
    return v;
  },

  _targets(card, myField, oppField) {
    if (!card.effect) return {};
    const e       = card.effect;
    const oppCards = [...(oppField.left||[]),...(oppField.right||[])];
    const myCards  = [...(myField.left ||[]),...(myField.right ||[])];
    const targets  = {};

    const strongest = arr => arr.reduce((a,b) => b.currentPower > (a?.currentPower||0) ? b : a, null);
    const weakest   = arr => arr.reduce((a,b) => (a?.currentPower||0) <= (b.currentPower||0) ? a : b, null);

    switch (e.action) {
      case 'damage':     if (oppCards.length) targets.targetCardId = strongest(oppCards)?.instanceId; break;
      case 'buff':       if (myCards.length)  targets.targetCardId = strongest(myCards)?.instanceId;  break;
      case 'steal':
      case 'destroy':    if (oppCards.length) targets.targetCardId = strongest(oppCards)?.instanceId; break;
      case 'trap':
      case 'curse':      if (oppCards.length) targets.targetCardId = strongest(oppCards)?.instanceId; break;
      case 'returnToHand': if (myCards.length) targets.targetCardId = weakest(myCards)?.instanceId;   break;
      case 'revive': {
        // handled in play logic
        break;
      }
      case 'consume': {
        const pool = myCards.filter(c => c.name !== 'Чернокнижник');
        if (pool.length) targets.targetCardId = weakest(pool)?.instanceId;
        break;
      }
    }
    return targets;
  },
};

// ═══════════════════════════════════════════════════════════════════════
// LOCAL BOT GAME
// ═══════════════════════════════════════════════════════════════════════
const BotGame = {
  state: null,
  myPid: 'player',
  botPid:'bot',

  start(saved, botFactionId) {
    applyFactionTheme(saved.faction);
    this.state = this._init(saved, botFactionId);
    showScreen('screen-game');
    GameUI.renderMulligan(this.state.player.hand, 'Бот');

    // Override confirm button for local mulligan
    el('btn-mulligan-confirm').onclick = () => {
      const selected = [...el('mulligan-hand').querySelectorAll('.card.selected')].map(c => c.dataset.iid);
      this._doMulligan(selected);
    };
  },

  _init(saved, botFid) {
    const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a; };
    const uid2 = () => Math.random().toString(36).slice(2,10);

    const pDeck = shuffle(saved.deck.map(c => ({...c, instanceId:uid2(), currentPower:c.power||0})));
    const bCards = FACTIONS[botFid]?.cards || [];
    // build bot deck greedily
    const botDeckRaw = []; const cnt = {}; let inf2 = 0;
    shuffle([...bCards]).forEach(c => {
      if (botDeckRaw.length >= 25) return;
      cnt[c.id] = (cnt[c.id]||0);
      if (cnt[c.id] >= (c.maxInDeck||1)) return;
      if (inf2 + c.influence > 170) return;
      botDeckRaw.push({...c, instanceId:uid2(), currentPower:c.power||0});
      cnt[c.id]++; inf2 += c.influence||0;
    });
    const bDeck = shuffle(botDeckRaw);

    return {
      round: 1, turn: 'player', phase: 'mulligan',
      player: {
        leader: saved.leader, leaderUsed: false, leaderCharges: null, faction: saved.faction,
        deck: pDeck.slice(10), hand: pDeck.slice(0, 10),
        field:{left:[],right:[]}, discard:[], passed:false, coins:0,
      },
      bot: {
        leader: FACTIONS[botFid]?.leaders?.[0] || {name:'Бот', ability:{type:'damage',value:3}},
        leaderUsed:false, leaderCharges:null, faction:botFid,
        deck: bDeck.slice(10), hand: bDeck.slice(0, 10),
        field:{left:[],right:[]}, discard:[], passed:false, coins:0,
      },
      traps: { player:[], bot:[] },
      curses:{ player:[], bot:[] },
    };
  },

  _doMulligan(cardIds) {
    const ps = this.state.player;
    cardIds.slice(0,3).forEach(iid => {
      const idx = ps.hand.findIndex(c => c.instanceId === iid || c.id === iid);
      if (idx !== -1 && ps.deck.length > 0) {
        ps.deck.push(ps.hand.splice(idx,1)[0]);
        ps.deck = this._shuffle(ps.deck);
        ps.hand.push(ps.deck.shift());
      }
    });
    // Bot mulligan
    const bs   = this.state.bot;
    const swap = BotAI.decideMulligan(bs.hand);
    swap.forEach(iid => {
      const idx = bs.hand.findIndex(c => c.instanceId === iid);
      if (idx !== -1 && bs.deck.length > 0) {
        bs.deck.push(bs.hand.splice(idx,1)[0]);
        bs.deck = this._shuffle(bs.deck);
        bs.hand.push(bs.deck.shift());
      }
    });
    this.state.phase = 'play';
    showScreen('screen-game');
    this._renderLocal();

    // Override UI action handlers to point here
    el('btn-pass').onclick   = () => this.playerPass();
    el('btn-forfeit').onclick= () => { if(confirm('Сдаться?')) this._end('bot'); };
  },

  playerPlayCard(cardId, row, ti = {}) {
    if (this.state.turn !== 'player' || this.state.phase !== 'play') return;
    const ps = this.state.player;
    const idx = ps.hand.findIndex(c => c.id === cardId || c.instanceId === cardId);
    if (idx === -1) return;
    const card = ps.hand.splice(idx, 1)[0];
    this._place('player', card, row, ti);
    this._tickCurses();
    this._renderLocal();
    this.state.turn = 'bot';
    if (!ps.passed && !this.state.bot.passed) {
      setTimeout(() => this._botTurn(), 900);
    } else if (ps.passed && this.state.bot.passed) {
      this._endRound();
    }
  },

  playerPass() {
    if (this.state.turn !== 'player') return;
    this.state.player.passed = true;
    Anim.toast('Вы спасовали');
    this._renderLocal();
    if (this.state.bot.passed) { this._endRound(); return; }
    this.state.turn = 'bot';
    setTimeout(() => this._botTurn(), 700);
  },

  async _botTurn() {
    if (this.state.phase !== 'play') return;
    const bs = this.state.bot;
    const ps = this.state.player;
    const decision = BotAI.decide(
      bs.hand, bs.field, ps.field,
      this._score(bs.field), this._score(ps.field),
      this.state.round, bs.leaderUsed
    );

    if (decision.action === 'pass') {
      bs.passed = true;
      Anim.toast('Бот спасовал', 1500);
      this._renderLocal();
      if (ps.passed) this._endRound();
      else { this.state.turn = 'player'; this._renderLocal(); }
      return;
    }

    if (decision.action === 'play' && decision.card) {
      const idx = bs.hand.findIndex(c => c.instanceId === decision.card.instanceId);
      if (idx !== -1) {
        const card = bs.hand.splice(idx, 1)[0];
        // bot auto pick target from discard if needed
        if (decision.targets?.fromDiscard || card.effect?.action === 'revive') {
          const disc = bs.discard.filter(c => c.type !== 'gold' && c.type !== 'special');
          if (disc.length) decision.targets.targetCardId = disc.reduce((a,b) => b.power > a.power ? b : a).instanceId;
        }
        this._place('bot', card, decision.row, decision.targets || {});
        this._tickCurses();
        this._renderLocal();
      }
    }

    if (ps.passed && bs.passed) { this._endRound(); return; }
    if (ps.passed) { setTimeout(() => this._botTurn(), 1100); return; }
    this.state.turn = 'player';
    this._renderLocal();
  },

  _place(who, card, row, ti) {
    const ps  = this.state[who];
    const opp = this.state[who === 'player' ? 'bot' : 'player'];
    const uid2 = () => Math.random().toString(36).slice(2,10);
    const r = ['left','right'].includes(row) ? row : 'left';

    card.instanceId = card.instanceId || uid2();
    card.currentPower = card.power || 0;

    if (card.type === 'special' && card.discardAfterUse !== false) {
      ps.discard.push(card);
    } else if (card.row === 'enemy_field') {
      if ((opp.field[r]||[]).length < 4) opp.field[r].push(card);
    } else {
      if ((ps.field[r]||[]).length < 4) ps.field[r].push(card);
    }

    if (card.effect && card.effect.type !== 'passive') {
      this._applyEffect(who, card, ti);
    }
    this._checkSynergy(ps, r);
    this._checkApocalypse(who);
  },

  _applyEffect(who, card, ti) {
    const ps  = this.state[who];
    const opp = this.state[who === 'player' ? 'bot' : 'player'];
    const e   = card.effect;
    const uid2 = () => Math.random().toString(36).slice(2,10);
    const allMe  = [...(ps.field.left||[]),...(ps.field.right||[])];
    const allOpp = [...(opp.field.left||[]),...(opp.field.right||[])];

    const findOpp = id => allOpp.find(c => c.instanceId === id);
    const findMe  = id => allMe.find(c => c.instanceId === id);
    const strongest = arr => arr.reduce((a,b) => b.currentPower > (a?.currentPower||0) ? b : a, null);

    switch (e.action) {
      case 'buff': {
        if (e.target === 'own_unit_selectable') {
          const t = ti.targetCardId ? findMe(ti.targetCardId) : strongest(allMe);
          if (t) { t.currentPower += e.value||0; this._checkTraps(who, t, e.value||0); }
        } else if (e.target === 'all_own') {
          allMe.forEach(c => { c.currentPower += e.value||0; this._checkTraps(who, c, e.value||0); });
        } else if (e.target === 'row') {
          const r2 = card.row !== 'any' ? card.row : (ti.row||'left');
          (ps.field[r2]||[]).forEach(c => { c.currentPower += e.value||0; this._checkTraps(who, c, e.value||0); });
        } else if (e.target === 'archbishop') {
          const arch = allMe.find(c => c.name === 'Архиепископ Сентор');
          if (arch) arch.currentPower += e.power || 10;
        } else if (e.target === 'forest_children') {
          allMe.filter(c => c.name === 'Дети Леса').forEach(c => c.currentPower += e.value||0);
        } else if (e.count && ti.targetCardIds) {
          ti.targetCardIds.forEach(id => { const t = findMe(id); if(t) t.currentPower += e.value||0; });
        }
        break;
      }
      case 'damage': {
        if (['any_enemy','any_enemy_selectable'].includes(e.target)) {
          const t = ti.targetCardId ? findOpp(ti.targetCardId) : strongest(allOpp);
          if (t) this._damage(opp, t, e.value||0, who);
        } else if (e.target === 'enemy_score') {
          const t = strongest(allOpp);
          if (t) this._damage(opp, t, e.value||0, who);
        } else if (e.target === 'any_unit_selectable') {
          const tO = ti.targetCardId ? findOpp(ti.targetCardId) : null;
          const tM = ti.targetCardId ? findMe(ti.targetCardId)  : null;
          if (tO) this._damage(opp, tO, e.value||0, who);
          else if (tM) this._damage(ps, tM, e.value||0, who);
        }
        break;
      }
      case 'steal': {
        const t = ti.targetCardId ? findOpp(ti.targetCardId) : strongest(allOpp);
        if (t) {
          this._removeFromField(opp, t.instanceId);
          if (e.target === 'any_enemy_field') ps.hand.push(t);
          else if ((ps.field[ti.row||'left']||[]).length < 4) ps.field[ti.row||'left'].push(t);
        }
        break;
      }
      case 'play_top_deck': {
        if (ps.deck.length > 0) {
          const top = ps.deck.shift();
          top.instanceId = uid2(); top.currentPower = top.power||0;
          if ((ps.field[top.row !== 'any' ? top.row : 'left']||[]).length < 4)
            ps.field[top.row !== 'any' ? top.row : 'left'].push(top);
          if (top.effect && top.effect.type !== 'passive') this._applyEffect(who, top, {});
        }
        break;
      }
      case 'synergy': {
        if (e.target === 'same_name_row') {
          for (const r2 of ['left','right']) {
            const same = (ps.field[r2]||[]).filter(c => c.name === card.name);
            if (same.length > 1) same.forEach(c => c.currentPower += e.value||0);
          }
        }
        break;
      }
      case 'trap': {
        const t = ti.targetCardId ? findOpp(ti.targetCardId) : strongest(allOpp);
        if (t) this.state.traps[who].push({ targetId: t.instanceId, trigger: e.trigger, damage: e.value||3 });
        break;
      }
      case 'curse': {
        const t = ti.targetCardId ? findOpp(ti.targetCardId) : strongest(allOpp);
        if (t) this.state.curses[who].push({ cardInstanceId: t.instanceId, turnsLeft: e.turns||3, damage: e.value||2 });
        break;
      }
      case 'returnToHand': {
        const t = ti.targetCardId ? findMe(ti.targetCardId) : allMe[0];
        if (t) { this._removeFromField(ps, t.instanceId); ps.hand.push(t); }
        break;
      }
      case 'revive': {
        const idx = ti.targetCardId
          ? ps.discard.findIndex(c => c.instanceId === ti.targetCardId)
          : ps.discard.findIndex(c => c.type !== 'gold' && c.type !== 'special');
        if (idx !== -1) {
          const c = ps.discard.splice(idx, 1)[0];
          c.currentPower = c.power||0;
          if ((ps.field[c.row !== 'any' ? c.row : 'left']||[]).length < 4)
            ps.field[c.row !== 'any' ? c.row : 'left'].push(c);
        }
        break;
      }
      case 'destroy': {
        const pickOpp = () => e.target === 'any_enemy_not_gold'
          ? allOpp.filter(c => c.type !== 'gold') : allOpp;
        if (e.target === 'own_unit_selectable') {
          const t = ti.targetCardId ? findMe(ti.targetCardId) : allMe[0];
          if (t) { this._onDeath(who, ps, t); this._removeFromField(ps, t.instanceId); ps.discard.push(t); }
        } else {
          const pool = pickOpp();
          const t = ti.targetCardId ? pool.find(c => c.instanceId === ti.targetCardId) : strongest(pool);
          if (t) { this._onDeath(who === 'player' ? 'bot' : 'player', opp, t); this._removeFromField(opp, t.instanceId); opp.discard.push(t); }
        }
        break;
      }
      case 'summon': {
        if (e.card) {
          for (let i = 0; i < (e.count||1); i++) {
            const idx2 = ps.deck.findIndex(c => c.id === e.card);
            if (idx2 !== -1) {
              const s = ps.deck.splice(idx2,1)[0];
              s.instanceId = uid2(); s.currentPower = s.power||0;
              if ((ps.field[s.row !== 'any' ? s.row : 'right']||[]).length < 4)
                ps.field[s.row !== 'any' ? s.row : 'right'].push(s);
            }
          }
        }
        break;
      }
      case 'steal_deck': {
        if (opp.deck.length > 0) {
          const top = opp.deck.shift();
          top.instanceId = uid2(); top.currentPower = top.power||0;
          if ((ps.field[top.row !== 'any' ? top.row : 'left']||[]).length < 4)
            ps.field[top.row !== 'any' ? top.row : 'left'].push(top);
          if (top.effect && top.effect.type !== 'passive') this._applyEffect(who, top, {});
        }
        break;
      }
      case 'randomize_stats': {
        const [min, max] = e.powerRange || [1,14];
        card.currentPower = Math.floor(Math.random() * (max - min + 1)) + min;
        break;
      }
    }
  },

  _damage(ownerPs, card, dmg, killerWho) {
    card.currentPower = Math.max(0, (card.currentPower||0) - dmg);
    if (card.currentPower === 0) {
      const ownerWho = ownerPs === this.state.player ? 'player' : 'bot';
      this._onDeath(ownerWho, ownerPs, card);
      this._removeFromField(ownerPs, card.instanceId);
      ownerPs.discard.push(card);
      this._checkApocalypse(killerWho);
    }
  },

  _onDeath(who, ps, card) {
    if (!card.effect || card.effect.type !== 'onDeath') return;
    const opp = this.state[who === 'player' ? 'bot' : 'player'];
    const e   = card.effect;
    const uid2 = () => Math.random().toString(36).slice(2,10);
    switch (e.action) {
      case 'summon_enemy': {
        const ghost = { name:'Призрак', type:'white', row:'any', power:1,
          effect:{type:'onDeath',action:'summon_enemy'},
          instanceId:uid2(), currentPower:1 };
        if ((opp.field.left||[]).length < 4) opp.field.left.push(ghost);
        break;
      }
      case 'add_charge': {
        const allMe2 = [...(ps.field.left||[]),...(ps.field.right||[])];
        const wl = allMe2.find(c => c.name === 'Чернокнижник');
        if (wl) wl.charges = (wl.charges||0) + (e.value||1);
        break;
      }
    }
  },

  _checkTraps(buffedWho, card, delta) {
    const trapOwner = buffedWho === 'player' ? 'bot' : 'player';
    const ownerPs   = this.state[buffedWho];
    this.state.traps[trapOwner] = (this.state.traps[trapOwner]||[]).filter(trap => {
      if (trap.trigger === 'enemy_buff' && trap.targetId === card.instanceId) {
        this._damage(ownerPs, card, trap.damage, trapOwner);
        return false;
      }
      return true;
    });
  },

  _tickCurses() {
    for (const who of ['player','bot']) {
      const opp = this.state[who === 'player' ? 'bot' : 'player'];
      this.state.curses[who] = (this.state.curses[who]||[]).filter(curse => {
        const allOpp = [...(opp.field.left||[]),...(opp.field.right||[])];
        const t = allOpp.find(c => c.instanceId === curse.cardInstanceId);
        if (t) { this._damage(opp, t, curse.damage, who); curse.turnsLeft--; }
        else curse.turnsLeft = 0;
        return curse.turnsLeft > 0;
      });
    }
  },

  _checkSynergy(ps, row) {
    const rowCards = ps.field[row]||[];
    const children = rowCards.filter(c => c.name === 'Дети Леса');
    if (children.length === 2) children.forEach(c => { if(!c._sd) { c.currentPower+=4; c._sd=true; } });
  },

  _checkApocalypse(who) {
    const ps = this.state[who];
    for (const r2 of ['left','right']) {
      const names = (ps.field[r2]||[]).map(c => c.name);
      if (['Война','Чума','Голод'].every(n => names.includes(n))) {
        const idx = ps.deck.findIndex(c => c.name === 'Апокалипсис');
        if (idx !== -1) {
          ps.hand.push(ps.deck.splice(idx,1)[0]);
          Anim.toast('💀 Апокалипсис призван!', 2500);
        }
      }
    }
  },

  _removeFromField(ps, iid) {
    for (const r2 of ['left','right']) {
      const idx = (ps.field[r2]||[]).findIndex(c => c.instanceId === iid);
      if (idx !== -1) { ps.field[r2].splice(idx,1); return; }
    }
  },

  _score(field) {
    return [...(field.left||[]),...(field.right||[])].reduce((s,c) => s+(c.currentPower||0), 0);
  },

  _shuffle(arr) {
    for (let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
    return arr;
  },

  _endRound() {
    const s1 = this._score(this.state.player.field);
    const s2 = this._score(this.state.bot.field);
    let winner = null;
    if (s1 > s2)      { this.state.player.coins++; winner = 'player'; }
    else if (s2 > s1) { this.state.bot.coins++;    winner = 'bot'; }
    else              { this.state.player.coins++; this.state.bot.coins++; }

    const won = winner === 'player';
    const draw = !winner;
    Anim.toast(draw ? '🤝 Ничья в раунде' : won ? '⭐ Вы выиграли раунд!' : '💀 Бот выиграл раунд', 2500);

    for (const who of ['player','bot']) {
      const ps = this.state[who];
      for (const r2 of ['left','right']) { ps.discard.push(...(ps.field[r2]||[])); ps.field[r2]=[]; }
      ps.passed = false;
    }
    this.state.traps  = { player:[], bot:[] };
    this.state.curses = { player:[], bot:[] };

    if (this.state.player.coins >= 2 || this.state.bot.coins >= 2 || this.state.round >= 3) {
      this._end(winner);
      return;
    }

    this.state.round++;
    for (const who of ['player','bot']) {
      const ps = this.state[who];
      if (ps.deck.length > 0) ps.hand.push(ps.deck.shift());
    }
    this.state.phase = 'play';
    this.state.turn  = winner || 'player';
    this._renderLocal();

    if (this.state.turn === 'bot') setTimeout(() => this._botTurn(), 1200);
  },

  _end(winner) {
    this.state.phase = 'gameOver';
    const pc = this.state.player.coins;
    const bc = this.state.bot.coins;
    GameUI.showGameOver({
      winner,
      coins: { player: pc, bot: bc },
      reason: '',
      ratings: null,
    }, 'player');
    // Override play-again
    el('btn-play-again').onclick = () => showScreen('screen-main');
  },

  _renderLocal() {
    const s  = this.state;
    const me = s.player;
    const opp= s.bot;
    const pScore = this._score(me.field);
    const bScore = this._score(opp.field);

    const view = {
      round: s.round, phase: s.phase,
      myTurn: s.turn === 'player',
      me: {
        name:'Вы', faction:me.faction, leader:me.leader, leaderUsed:me.leaderUsed,
        leaderCharges:me.leaderCharges,
        hand: me.hand, field: me.field, discard: me.discard,
        deck: me.deck.length, score: pScore, coins: me.coins, passed: me.passed,
      },
      opponent: {
        name:'Бот', faction:opp.faction, leader:opp.leader, leaderUsed:opp.leaderUsed,
        handCount: opp.hand.length, field: opp.field, discard: opp.discard,
        deck: opp.deck.length, score: bScore, coins: opp.coins, passed: opp.passed,
      },
      log:[],
    };
    GameUI.render(view, 'player1');

    // Override play card — route to BotGame
    el('hand-container').querySelectorAll('.card').forEach(cardEl => {
      cardEl.onclick = async e => {
        e.stopPropagation();
        if (s.turn !== 'player' || me.passed) return;
        const iid  = cardEl.dataset.iid;
        const card = me.hand.find(c => (c.instanceId||c.id) === iid);
        if (!card) return;

        let row = card.row;
        if (row === 'any' || card.type === 'special') {
          row = await GameUI._pickRow.call(GameUI);
          if (!row) return;
        }
        const cardWithPower = { ...card, currentPower: card.currentPower || card.power };
        const ti = await GameUI._gatherTargets.call(GameUI, cardWithPower, row);
        if (ti === null) return;
        BotGame.playerPlayCard(iid, row, ti);
      };
    });
    el('btn-pass').onclick    = () => this.playerPass();
    el('btn-forfeit').onclick = () => { if(confirm('Сдаться?')) this._end('bot'); };
  },
};

// ═══════════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  try {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  } catch(e) {}

  try { DB.init(); } catch(e) { console.error('DB init error:', e); }
  try { Game.init(); } catch(e) { console.error('Game init error:', e); }

  // Safety: bind buttons directly in case Game.init partly failed
  const safeEl = id => document.getElementById(id);

  safeEl('btn-find-match')?.addEventListener('click', () => {
    try { Game.findMatch(); } catch(e) { Anim.toast('Ошибка. Перезапустите.'); console.error(e); }
  });
  safeEl('btn-deck-builder')?.addEventListener('click', () => {
    try { DB.open(); } catch(e) { console.error(e); }
  });
  safeEl('btn-vs-bot')?.addEventListener('click', () => {
    try {
      const saved = DB.getSaved();
      if (!saved) { Anim.toast('Сначала соберите колоду 🃏'); return; }
      Game._showBotPicker(saved);
    } catch(e) { console.error(e); }
  });
  safeEl('btn-cancel-queue')?.addEventListener('click', () => { try { Game.cancelQueue(); } catch(e){} });
  safeEl('btn-play-again')?.addEventListener('click',  () => showScreen('screen-main'));
});
