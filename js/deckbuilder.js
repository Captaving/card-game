// ═══════════════════════════════════════════════════════════════════════════
// DECK BUILDER + SAVED DECKS
// ═══════════════════════════════════════════════════════════════════════════

const DeckBuilder = {
  currentFaction: null,
  currentLeader:  null,
  selectedCards:  [],   // { card, count }
  totalInfluence: 0,

  STORAGE_KEY: 'lily_wars_decks',

  // ── Open deck builder ────────────────────────────────────────────────────
  open() {
    const modal = document.getElementById('deckbuilder-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    this._renderFactionSelect();
  },

  close() {
    document.getElementById('deckbuilder-modal').style.display = 'none';
  },

  // ── Faction select ────────────────────────────────────────────────────────
  _renderFactionSelect() {
    const el = document.getElementById('db-faction-select');
    if (!el) return;
    el.innerHTML = '';
    const factions = Object.values(window.FACTIONS || {});
    factions.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'db-faction-btn';
      btn.textContent = f.name;
      btn.style.borderColor = f.color;
      btn.style.color = f.color;
      if (this.currentFaction?.id === f.id) btn.classList.add('active');
      btn.onclick = () => { this.currentFaction = f; this.selectedCards = []; this.totalInfluence = 0; this._renderLeaderSelect(); this._renderCardPool(); this._updateStats(); };
      el.appendChild(btn);
    });
  },

  // ── Leader select ─────────────────────────────────────────────────────────
  _renderLeaderSelect() {
    const el = document.getElementById('db-leader-select');
    if (!el || !this.currentFaction) return;
    el.innerHTML = '<div class="db-section-title">Выберите лидера</div>';
    this.currentFaction.leaders.forEach(leader => {
      const btn = document.createElement('div');
      btn.className = 'db-leader-btn' + (this.currentLeader?.id === leader.id ? ' active' : '');
      btn.innerHTML = `<strong>${leader.name}</strong><span>${leader.ability.description}</span>`;
      btn.style.borderColor = this.currentFaction.color;
      btn.onclick = () => { this.currentLeader = leader; this._renderLeaderSelect(); };
      el.appendChild(btn);
    });
  },

  // ── Card pool ─────────────────────────────────────────────────────────────
  _renderCardPool() {
    const el = document.getElementById('db-card-pool');
    if (!el || !this.currentFaction) return;
    el.innerHTML = '';

    const filter = document.getElementById('db-filter-type')?.value || 'all';
    const search  = (document.getElementById('db-search')?.value || '').toLowerCase();

    // Group by type
    const order = ['white','gray','purple','gold','special'];
    const groups = {};
    order.forEach(t => groups[t] = []);

    this.currentFaction.cards.forEach(card => {
      if (filter !== 'all' && card.type !== filter) return;
      if (search && !card.name.toLowerCase().includes(search)) return;
      // Deduplicate by name
      const existing = groups[card.type].find(c => c.name === card.name);
      if (!existing) groups[card.type].push(card);
    });

    order.forEach(type => {
      if (!groups[type].length) return;
      const section = document.createElement('div');
      section.className = 'db-type-section';
      const typeNames = { white: 'Белые', gray: 'Серые', purple: 'Фиолетовые', gold: 'Золотые', special: 'Особые' };
      section.innerHTML = `<div class="db-type-title db-type-${type}">${typeNames[type]}</div>`;

      groups[type].forEach(card => {
        const inDeck = this.selectedCards.find(e => e.card.name === card.name);
        const count  = inDeck ? inDeck.count : 0;
        const cardEl = document.createElement('div');
        cardEl.className = `db-card-row${count > 0 ? ' in-deck' : ''}`;
        cardEl.innerHTML = `
          <div class="db-card-power card-power-badge card-${card.type}">${card.power || '—'}</div>
          <div class="db-card-info">
            <div class="db-card-name">${card.name}</div>
            <div class="db-card-meta">Влияние: ${card.influence} · Макс: ${card.maxInDeck}</div>
            ${card.effect ? `<div class="db-card-effect">${card.effect.description}</div>` : ''}
          </div>
          <div class="db-card-controls">
            <button class="db-btn-remove" ${count === 0 ? 'disabled' : ''}>−</button>
            <span class="db-card-count">${count}</span>
            <button class="db-btn-add" ${count >= card.maxInDeck ? 'disabled' : ''}>+</button>
          </div>
        `;
        cardEl.querySelector('.db-btn-add').onclick    = (e) => { e.stopPropagation(); this._addCard(card); this._renderCardPool(); this._updateDeckList(); };
        cardEl.querySelector('.db-btn-remove').onclick = (e) => { e.stopPropagation(); this._removeCard(card); this._renderCardPool(); this._updateDeckList(); };
        cardEl.onclick = () => this._showCardDetail(card);
        section.appendChild(cardEl);
      });

      el.appendChild(section);
    });
  },

  // ── Deck list ─────────────────────────────────────────────────────────────
  _updateDeckList() {
    const el = document.getElementById('db-deck-list');
    if (!el) return;
    el.innerHTML = '';
    this.selectedCards.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'db-deck-entry';
      row.innerHTML = `
        <span class="db-deck-count">${entry.count}x</span>
        <span class="db-deck-name">${entry.card.name}</span>
        <span class="db-deck-inf">${entry.card.influence * entry.count}</span>
      `;
      el.appendChild(row);
    });
    this._updateStats();
  },

  _updateStats() {
    const total = this.selectedCards.reduce((s, e) => s + e.count, 0);
    const inf   = this.selectedCards.reduce((s, e) => s + e.card.influence * e.count, 0);
    this.totalInfluence = inf;
    const statsEl = document.getElementById('db-stats');
    if (statsEl) statsEl.textContent = `Карт: ${total}/25 · Влияние: ${inf}/170`;
    const saveBtn = document.getElementById('db-btn-save');
    if (saveBtn) saveBtn.disabled = total !== 25 || inf > 170 || !this.currentLeader;
  },

  // ── Add / remove ──────────────────────────────────────────────────────────
  _addCard(card) {
    const total = this.selectedCards.reduce((s, e) => s + e.count, 0);
    if (total >= 25) { UI.showToast('Максимум 25 карт в колоде'); return; }
    const inf = this.totalInfluence + card.influence;
    if (inf > 170) { UI.showToast(`Лимит влияния: ${this.totalInfluence}/170`); return; }
    const entry = this.selectedCards.find(e => e.card.name === card.name);
    if (entry) {
      if (entry.count >= card.maxInDeck) { UI.showToast(`Макс. ${card.maxInDeck} копии`); return; }
      entry.count++;
    } else {
      this.selectedCards.push({ card, count: 1 });
    }
    this.totalInfluence += card.influence;
    this._updateStats();
  },

  _removeCard(card) {
    const entry = this.selectedCards.find(e => e.card.name === card.name);
    if (!entry) return;
    entry.count--;
    this.totalInfluence -= card.influence;
    if (entry.count === 0) this.selectedCards = this.selectedCards.filter(e => e.card.name !== card.name);
    this._updateStats();
  },

  // ── Save / load ───────────────────────────────────────────────────────────
  save() {
    if (!this.currentLeader || !this.currentFaction) { UI.showToast('Выберите лидера'); return; }
    const total = this.selectedCards.reduce((s, e) => s + e.count, 0);
    if (total !== 25) { UI.showToast('Нужно ровно 25 карт'); return; }
    if (this.totalInfluence > 170) { UI.showToast('Превышено влияние'); return; }

    // Expand to flat array
    const deck = [];
    this.selectedCards.forEach(e => { for (let i = 0; i < e.count; i++) deck.push({ ...e.card }); });

    const saved = this._loadSaved();
    const name  = `${this.currentFaction.name} — ${this.currentLeader.name}`;
    saved[this.currentFaction.id] = { name, faction: this.currentFaction.id, leader: this.currentLeader, deck };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saved));

    UI.showToast(`✓ Колода сохранена: ${name}`);
    this.close();
    this._renderSavedDecks();

    // Set as active deck for the game client
    if (window.game) window.game.setDeck(deck, this.currentFaction.id, this.currentLeader);
  },

  _loadSaved() {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}'); } catch { return {}; }
  },

  loadDeck(factionId) {
    const saved = this._loadSaved();
    return saved[factionId] || null;
  },

  // ── Saved decks list ──────────────────────────────────────────────────────
  _renderSavedDecks() {
    const el = document.getElementById('saved-decks-list');
    if (!el) return;
    el.innerHTML = '';
    const saved = this._loadSaved();
    const factions = window.FACTIONS || {};
    const entries = Object.values(saved);
    if (!entries.length) {
      el.innerHTML = '<div class="saved-deck-empty">Нет сохранённых колод</div>';
      return;
    }
    entries.forEach(d => {
      const f = factions[d.faction];
      const row = document.createElement('div');
      row.className = 'saved-deck-row';
      row.innerHTML = `
        <div class="saved-deck-info">
          <div class="saved-deck-name" style="color:${f?.color || '#fff'}">${d.name}</div>
          <div class="saved-deck-meta">${d.deck.length} карт</div>
        </div>
        <button class="btn-primary btn-sm">Играть</button>
      `;
      row.querySelector('button').onclick = () => {
        if (window.game) window.game.setDeck(d.deck, d.faction, d.leader);
        UI.showToast(`Колода выбрана: ${d.name}`);
      };
      el.appendChild(row);
    });
  },

  // ── Card detail ──────────────────────────────────────────────────────────
  _showCardDetail(card) {
    document.getElementById('detail-name').textContent   = card.name;
    document.getElementById('detail-type').textContent   = { white:'Белый', gray:'Серый', purple:'Фиолетовый', gold:'Золотой', special:'Особая' }[card.type] || card.type;
    document.getElementById('detail-power').textContent  = `Сила: ${card.power}`;
    document.getElementById('detail-faction').textContent = card.influence ? `Влияние: ${card.influence}` : '';
    document.getElementById('detail-effect').textContent  = card.effect?.description || 'Нет эффекта';
    document.getElementById('card-detail-modal').style.display = 'flex';
  },

  // ── Init UI ───────────────────────────────────────────────────────────────
  init() {
    document.getElementById('btn-deck-builder')?.addEventListener('click', () => this.open());
    document.getElementById('db-btn-close')?.addEventListener('click', () => this.close());
    document.getElementById('db-btn-save')?.addEventListener('click', () => this.save());
    document.getElementById('db-filter-type')?.addEventListener('change', () => this._renderCardPool());
    document.getElementById('db-search')?.addEventListener('input', () => this._renderCardPool());
    this._renderSavedDecks();

    // Auto-load last used deck
    const factions = Object.keys(window.FACTIONS || {});
    for (const fid of factions) {
      const d = this.loadDeck(fid);
      if (d && window.game) { window.game.setDeck(d.deck, d.faction, d.leader); break; }
    }
  }
};
