// ═══════════════════════════════════════════════════════════════════════════
// BOT AI — Solo play (runs entirely in browser)
// ═══════════════════════════════════════════════════════════════════════════

const BotGame = {
  game:    null,
  ui:      null,
  botRole: 'player2',
  myRole:  'player1',
  thinkDelay: 1200,

  // ── Start a bot game ──────────────────────────────────────────────────────
  start(playerDeck, playerFaction, playerLeader) {
    const botDeck = this._buildBotDeck();
    this.game = this._createLocalGame(playerDeck, playerFaction, playerLeader, botDeck);
    this.myRole  = 'player1';
    this.botRole = 'player2';
    UI._showScreen('screen-game');
    UI.client = this; // hook UI to bot game
    this._emitState();
    // mulligan — bot does random
    this._botMulligan();
  },

  // ── Build a simple bot deck ───────────────────────────────────────────────
  _buildBotDeck() {
    // Use Рыцари Цветка Лилии as bot faction
    const factionId = 'knights';
    const faction = window.FACTIONS?.[factionId];
    if (!faction) return [];
    const deck = [];
    const counts = {};
    const shuffled = [...faction.cards].sort(() => Math.random() - 0.5);
    for (const card of shuffled) {
      if (deck.length >= 25) break;
      const inf = deck.reduce((s, c) => s + c.influence, 0) + card.influence;
      if (inf > 170) continue;
      counts[card.name] = (counts[card.name] || 0);
      if (counts[card.name] >= card.maxInDeck) continue;
      deck.push({ ...card });
      counts[card.name]++;
    }
    return deck;
  },

  // ── Create local game state (mirrors server logic) ────────────────────────
  _createLocalGame(p1Deck, p1Faction, p1Leader, p2Deck) {
    const shuffle = arr => { const a = [...arr]; for (let i = a.length-1; i>0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
    const uid = () => Math.random().toString(36).substr(2,8);
    const mkHand = (deck) => { const d = shuffle(deck); const h = d.splice(0,10); return { deck: d, hand: h }; };

    const p1 = mkHand(p1Deck);
    const p2 = mkHand(p2Deck);

    const mkState = (hand, deck, faction, leader, name) => ({
      id: uid(), name, faction, leader,
      hand: hand.map(c => ({ ...c, instanceId: uid(), currentPower: c.power })),
      deck: deck.map(c => ({ ...c, instanceId: uid(), currentPower: c.power })),
      field: { left: [], right: [] },
      discard: [], score: 0, coins: 0, passed: false,
      leaderUsed: false, traps: [], curses: []
    });

    const botFaction = 'knights';
    const botLeader  = window.FACTIONS?.[botFaction]?.leaders?.[0] || { name: 'Бот', ability: { type: 'damage', value: 3, description: 'Урон' } };

    return {
      id: 'local_' + uid(),
      round: 1, phase: 'mulligan',
      turn: 'p1',
      p1: mkState(p1.hand, p1.deck, p1Faction, p1Leader, 'Вы'),
      p2: mkState(p2.hand, p2.deck, botFaction, botLeader, '🤖 Бот'),
      log: [], _uid: uid
    };
  },

  // ── Mulligan ──────────────────────────────────────────────────────────────
  _botMulligan() {
    // Bot: replace lowest-power cards
    const g = this.game;
    const bot = g.p2;
    const toSwap = [...bot.hand]
      .sort((a,b) => a.power - b.power)
      .slice(0, Math.floor(Math.random() * 2))
      .map(c => c.instanceId);
    toSwap.forEach(iid => {
      const idx = bot.hand.findIndex(c => c.instanceId === iid);
      if (idx !== -1 && bot.deck.length > 0) {
        bot.deck.push(bot.hand.splice(idx, 1)[0]);
        bot.deck.sort(() => Math.random() - 0.5);
        bot.hand.push(bot.deck.shift());
      }
    });
    g.phase = 'play';
    g.turn  = 'p1';
    this._emitState();
    UI.onGameStart();
  },

  // ── API mirror (used by UI) ───────────────────────────────────────────────
  mulligan(cardIds) {
    const g = this.game;
    cardIds.forEach(id => {
      const idx = g.p1.hand.findIndex(c => c.id === id || c.instanceId === id);
      if (idx !== -1 && g.p1.deck.length > 0) {
        g.p1.deck.push(g.p1.hand.splice(idx, 1)[0]);
        g.p1.deck.sort(() => Math.random() - 0.5);
        g.p1.hand.push(g.p1.deck.shift());
      }
    });
    g.phase = 'play'; g.turn = 'p1';
    this._emitState();
    UI.onGameStart();
  },

  playCard(cardId, row, targetInfo = {}) {
    const g = this.game;
    if (g.turn !== 'p1' || g.p1.passed) return;
    const idx = g.p1.hand.findIndex(c => c.id === cardId || c.instanceId === cardId);
    if (idx === -1) return;
    const card = g.p1.hand.splice(idx, 1)[0];
    card.currentPower = card.power;
    const targetRow = row || (card.row !== 'any' ? card.row : 'left');
    if (card.type !== 'special' && card.row !== 'enemy_field') {
      if (g.p1.field[targetRow]?.length >= 4) { g.p1.hand.push(card); UI.showError('Ряд заполнен'); return; }
      g.p1.field[targetRow] = g.p1.field[targetRow] || [];
      g.p1.field[targetRow].push(card);
    } else if (card.discardAfterUse) {
      g.p1.discard.push(card);
    }
    this._resolveEffect(g, 'p1', card, targetInfo);
    this._processCurses();
    this._checkApocalypse('p1');
    // Switch to bot
    if (!g.p2.passed) {
      g.turn = 'p2';
      this._emitState();
      setTimeout(() => this._botTurn(), this.thinkDelay);
    } else {
      if (g.p1.passed) this._endRound();
      else { g.turn = 'p1'; this._emitState(); }
    }
  },

  pass() {
    const g = this.game;
    if (g.turn !== 'p1') return;
    g.p1.passed = true;
    UI.onPlayerPassed({ role: 'player1' });
    if (g.p2.passed) { this._endRound(); return; }
    g.turn = 'p2';
    this._emitState();
    setTimeout(() => this._botTurn(), this.thinkDelay);
  },

  useLeader(targetInfo = {}) {
    const g = this.game;
    if (g.turn !== 'p1' || g.p1.leaderUsed) return;
    const ability = g.p1.leader?.ability;
    if (!ability) return;
    this._resolveLeaderAbility(g, 'p1', ability, targetInfo);
    g.p1.leaderUsed = true;
    g.turn = 'p2';
    this._emitState();
    setTimeout(() => this._botTurn(), this.thinkDelay);
  },

  forfeit() {
    UI.onGameOver({ winner: 'player2', reason: 'forfeit', scores: { player1: this.game.p1.coins, player2: this.game.p2.coins } });
  },

  setDeck() {}, // no-op for bot game
  send() {},    // no-op

  // ── Bot turn logic ────────────────────────────────────────────────────────
  _botTurn() {
    const g = this.game;
    if (g.phase !== 'play' || g.turn !== 'p2') return;
    if (g.p2.passed) { g.turn = 'p1'; this._emitState(); return; }

    const bot  = g.p2;
    const me   = g.p1;
    const myScore  = this._calcScore(me);
    const botScore = this._calcScore(bot);

    // Decision: pass if ahead and opponent has passed, or late round
    const totalCards = bot.hand.length;
    const shouldPass = (bot.passed === false) && (
      (botScore > myScore + 5 && totalCards <= 2) ||
      (me.passed && botScore > myScore)
    );

    if (shouldPass || bot.hand.length === 0) {
      bot.passed = true;
      UI.onPlayerPassed({ role: 'player2' });
      if (me.passed) { this._endRound(); return; }
      g.turn = 'p1';
      this._emitState();
      return;
    }

    // Pick best card to play
    const card = this._botPickCard(bot, me);
    if (!card) { bot.passed = true; if (me.passed) { this._endRound(); return; } g.turn = 'p1'; this._emitState(); return; }

    const idx = bot.hand.indexOf(card);
    bot.hand.splice(idx, 1);
    card.currentPower = card.power;

    const targetRow = card.row === 'any' ? (Math.random() > 0.5 ? 'left' : 'right') : (card.row === 'enemy_field' ? 'left' : card.row);

    if (card.type !== 'special' && card.row !== 'enemy_field') {
      bot.field[targetRow] = bot.field[targetRow] || [];
      if (bot.field[targetRow].length < 4) bot.field[targetRow].push(card);
      else { bot.hand.push(card); g.turn = 'p1'; this._emitState(); return; }
    } else if (card.discardAfterUse) {
      bot.discard.push(card);
    }

    // Bot target selection (simple: pick highest power enemy card)
    const targetInfo = this._botPickTarget(g, card);
    this._resolveEffect(g, 'p2', card, targetInfo);
    this._processCurses();
    this._checkApocalypse('p2');

    // Animate bot card play
    UI.showToast(`🤖 Бот сыграл: ${card.name}`, 1500);

    if (!me.passed) {
      g.turn = 'p1';
      this._emitState();
    } else {
      setTimeout(() => this._botTurn(), this.thinkDelay);
    }
  },

  _botPickCard(bot, opponent) {
    // Prioritize: special > gold > purple > gray > white
    // Also consider if behind on score
    const priority = { special: 5, gold: 4, purple: 3, gray: 2, white: 1 };
    const sorted = [...bot.hand].sort((a, b) => {
      const pa = priority[a.type] || 1;
      const pb = priority[b.type] || 1;
      if (pa !== pb) return pb - pa;
      return (b.power || 0) - (a.power || 0);
    });
    return sorted[0] || null;
  },

  _botPickTarget(g, card) {
    const allEnemy = [...g.p1.field.left, ...g.p1.field.right];
    const allOwn   = [...g.p2.field.left, ...g.p2.field.right];
    const highestEnemy = allEnemy.sort((a,b) => (b.currentPower||b.power) - (a.currentPower||a.power))[0];
    const lowestOwn    = allOwn.sort((a,b) => (a.currentPower||a.power) - (b.currentPower||b.power))[0];
    const highestOwn   = allOwn.sort((a,b) => (b.currentPower||b.power) - (a.currentPower||a.power))[0];
    const discardOwn   = g.p2.discard.filter(c => c.type !== 'gold' && c.type !== 'special')[0];

    const e = card.effect;
    if (!e) return {};

    switch (e.action) {
      case 'damage':
        if (e.target?.includes('enemy')) return { targetCardId: highestEnemy?.instanceId };
        return {};
      case 'buff':
        return { targetCardId: highestOwn?.instanceId };
      case 'steal':
        return { targetCardId: highestEnemy?.instanceId };
      case 'trap':
        return { targetCardId: highestEnemy?.instanceId };
      case 'curse':
        return { targetCardId: highestEnemy?.instanceId };
      case 'returnToHand':
        return { targetCardId: lowestOwn?.instanceId };
      case 'revive':
        return { targetCardId: discardOwn?.instanceId };
      case 'destroy':
        if (e.target?.includes('enemy')) return { targetCardId: highestEnemy?.instanceId };
        return { targetCardId: lowestOwn?.instanceId };
      case 'consume':
        return { targetCardId: lowestOwn?.instanceId };
      default:
        return {};
    }
  },

  // ── Simplified effect resolver (mirrors server) ───────────────────────────
  _resolveEffect(g, role, card, targetInfo) {
    const actor = g[role];
    const enemy = role === 'p1' ? g.p2 : g.p1;
    const e = card.effect;
    if (!e) return;

    const uid = () => Math.random().toString(36).substr(2,8);
    const findField = (ps, id) => { for (const r of ['left','right']) { const c = ps.field[r]?.find(x => x.instanceId === id); if (c) return c; } return null; };
    const removeField = (ps, id) => { for (const r of ['left','right']) { const i = ps.field[r]?.findIndex(x => x.instanceId === id); if (i !== -1) { ps.field[r].splice(i,1); return true; } } return false; };
    const allField = (ps) => [...(ps.field.left||[]), ...(ps.field.right||[])];
    const damage = (card, dmg, owner) => {
      card.currentPower = Math.max(0, (card.currentPower||0) - dmg);
      if (card.currentPower === 0) { removeField(owner, card.instanceId); owner.discard.push(card); }
    };
    const buff = (card, val) => {
      card.currentPower = (card.currentPower||0) + val;
      // Check traps
      enemy.traps?.forEach(t => { if (t.trigger === 'enemy_buff' && t.targetId === card.instanceId) { damage(card, t.damage, actor); } });
    };

    switch (e.action) {
      case 'buff': {
        if (e.target === 'own_unit_selectable' && targetInfo.targetCardId) {
          const t = findField(actor, targetInfo.targetCardId); if (t) buff(t, e.value);
        } else if (e.target === 'all_own') { allField(actor).forEach(c => buff(c, e.value)); }
        else if (e.target === 'row') {
          const row = card.row !== 'any' ? card.row : 'left';
          (actor.field[row]||[]).forEach(c => buff(c, e.value));
        } else if (e.target === 'archbishop') {
          const a = allField(actor).find(c => c.name === 'Архиепископ Сентор');
          if (a) buff(a, e.power || 10);
        } else if (e.target === 'adjacent') {
          for (const row of ['left','right']) {
            const idx = actor.field[row]?.findIndex(c => c.instanceId === card.instanceId);
            if (idx !== -1) {
              if (actor.field[row][idx-1]) buff(actor.field[row][idx-1], e.value);
              if (actor.field[row][idx+1]) buff(actor.field[row][idx+1], e.value);
            }
          }
        }
        break;
      }
      case 'damage': {
        const target = e.target?.includes('selectable') && targetInfo.targetCardId
          ? findField(enemy, targetInfo.targetCardId)
          : allField(enemy).sort((a,b) => (b.currentPower||0)-(a.currentPower||0))[0];
        if (target) damage(target, e.value, enemy);
        break;
      }
      case 'steal': {
        const t = targetInfo.targetCardId ? findField(enemy, targetInfo.targetCardId) : allField(enemy)[0];
        if (t) { removeField(enemy, t.instanceId); actor.hand.push(t); }
        break;
      }
      case 'trap': {
        if (targetInfo.targetCardId) actor.traps = actor.traps || [];
        actor.traps.push({ targetId: targetInfo.targetCardId, trigger: e.trigger, damage: e.value });
        break;
      }
      case 'curse': {
        const t = targetInfo.targetCardId ? findField(enemy, targetInfo.targetCardId) : allField(enemy)[0];
        if (t) { actor.curses = actor.curses || []; actor.curses.push({ cardInstanceId: t.instanceId, turnsLeft: e.turns||3, damage: e.value||2 }); }
        break;
      }
      case 'returnToHand': {
        const t = targetInfo.targetCardId ? findField(actor, targetInfo.targetCardId) : allField(actor)[0];
        if (t) { removeField(actor, t.instanceId); actor.hand.push(t); }
        break;
      }
      case 'revive': {
        const idx = actor.discard.findIndex(c => c.instanceId === targetInfo.targetCardId);
        if (idx !== -1) {
          const r = actor.discard.splice(idx,1)[0];
          r.currentPower = r.power;
          const row = r.row !== 'any' ? r.row : 'left';
          if ((actor.field[row]?.length||0) < 4) actor.field[row].push(r);
        }
        break;
      }
      case 'destroy': {
        const tEnemy = e.target?.includes('enemy') && targetInfo.targetCardId ? findField(enemy, targetInfo.targetCardId) : null;
        const tOwn   = targetInfo.targetCardId ? findField(actor, targetInfo.targetCardId) : null;
        if (tEnemy && e.target !== 'any_enemy_not_gold' || (tEnemy && tEnemy.type !== 'gold')) damage(tEnemy, 9999, enemy);
        if (!tEnemy && tOwn) damage(tOwn, 9999, actor);
        break;
      }
      case 'play_top_deck': {
        if (actor.deck.length > 0) {
          const top = actor.deck.shift();
          top.currentPower = top.power;
          const row = top.row !== 'any' ? top.row : 'left';
          if ((actor.field[row]?.length||0) < 4) { actor.field[row].push(top); this._resolveEffect(g, role, top, {}); }
        }
        break;
      }
      case 'summon': {
        for (let i = 0; i < (e.count||1); i++) {
          const idx = actor.deck.findIndex(c => c.id === e.card || c.name === 'Демон');
          if (idx !== -1) {
            const s = actor.deck.splice(idx,1)[0];
            s.instanceId = uid(); s.currentPower = s.power;
            const row = s.row !== 'any' ? s.row : 'right';
            if ((actor.field[row]?.length||0) < 4) actor.field[row].push(s);
          }
        }
        break;
      }
      case 'consume': {
        const t = targetInfo.targetCardId ? findField(actor, targetInfo.targetCardId) : allField(actor)[0];
        if (t && card.name === 'Чернокнижник') {
          const pw = t.currentPower||t.power;
          removeField(actor, t.instanceId); actor.discard.push(t);
          buff(card, pw); card.charges = (card.charges||1)-1;
        }
        break;
      }
      case 'double_trigger': {
        const row = card.row !== 'any' ? card.row : 'left';
        (actor.field[row]||[]).filter(c => c.instanceId !== card.instanceId && c.effect?.type === 'onPlay')
          .forEach(c => this._resolveEffect(g, role, c, {}));
        break;
      }
      case 'synergy': {
        for (const row of ['left','right']) {
          const idx = actor.field[row]?.findIndex(c => c.instanceId === card.instanceId);
          if (idx !== -1) {
            const same = actor.field[row].filter(c => c.name === card.name);
            if (same.length >= 2) same.forEach(c => buff(c, e.value));
          }
        }
        break;
      }
      case 'add_charge': {
        const wl = allField(actor).find(c => c.name === 'Чернокнижник');
        if (wl) wl.charges = (wl.charges||0) + (e.value||1);
        break;
      }
    }
  },

  _resolveLeaderAbility(g, role, ability, targetInfo) {
    const actor = g[role];
    const enemy = role === 'p1' ? g.p2 : g.p1;
    const allField = (ps) => [...(ps.field.left||[]), ...(ps.field.right||[])];
    const findField = (ps, id) => { for (const r of ['left','right']) { const c = ps.field[r]?.find(x => x.instanceId === id); if (c) return c; } return null; };
    const damage = (c, d, o) => { c.currentPower = Math.max(0,(c.currentPower||0)-d); if (c.currentPower===0) { for (const r of ['left','right']) { const i = o.field[r]?.indexOf(c); if (i!==-1) { o.field[r].splice(i,1); o.discard.push(c); } } } };

    switch (ability.type) {
      case 'damage': {
        const t = targetInfo.targetCardId ? findField(enemy, targetInfo.targetCardId) : allField(enemy)[0];
        if (t) damage(t, ability.value||3, enemy);
        break;
      }
      case 'buff': {
        if (ability.target === 'all_own') allField(actor).forEach(c => { c.currentPower = (c.currentPower||0) + (ability.value||1); });
        break;
      }
      case 'counter': enemy.leaderCountered = true; break;
      case 'summon': {
        const ghost = { id:'cultists_white_08', name:'Призрак', type:'white', row:'any', power:1, influence:2, instanceId: Math.random().toString(36).substr(2,6), currentPower:1 };
        if (!actor.leaderCharges) actor.leaderCharges = ability.maxUses||3;
        if (actor.leaderCharges > 0) { actor.leaderCharges--; (actor.field.left.length < 4 ? actor.field.left : actor.field.right).push(ghost); if (actor.leaderCharges > 0) actor.leaderUsed = false; }
        break;
      }
      case 'returnToHand': {
        const idx = actor.discard.findIndex(c => c.instanceId === targetInfo.targetCardId);
        if (idx !== -1) actor.hand.push(actor.discard.splice(idx,1)[0]);
        break;
      }
      case 'add_charge': {
        const wl = allField(actor).find(c => c.name === 'Чернокнижник');
        if (wl) wl.charges = (wl.charges||0) + 1;
        break;
      }
      case 'damage': { // dryads leader
        const t = targetInfo.targetCardId ? findField(enemy, targetInfo.targetCardId) : allField(enemy)[0];
        if (t) damage(t, ability.value||6, enemy);
        break;
      }
    }
  },

  _processCurses() {
    const g = this.game;
    for (const ps of [g.p1, g.p2]) {
      const toRemove = [];
      for (const curse of (ps.curses||[])) {
        for (const r of ['left','right']) {
          const c = ps.field[r]?.find(x => x.instanceId === curse.cardInstanceId);
          if (c) { c.currentPower = Math.max(0,(c.currentPower||0)-curse.damage); if (c.currentPower===0) { ps.field[r].splice(ps.field[r].indexOf(c),1); ps.discard.push(c); } }
        }
        curse.turnsLeft--;
        if (curse.turnsLeft <= 0) toRemove.push(curse);
      }
      if (ps.curses) ps.curses = ps.curses.filter(c => !toRemove.includes(c));
    }
  },

  _checkApocalypse(role) {
    const ps = this.game[role];
    const uid = () => Math.random().toString(36).substr(2,8);
    for (const row of ['left','right']) {
      const names = (ps.field[row]||[]).map(c => c.name);
      if (['Война','Чума','Голод'].every(n => names.includes(n))) {
        const idx = ps.deck.findIndex(c => c.name === 'Апокалипсис');
        if (idx !== -1) { const a = ps.deck.splice(idx,1)[0]; ps.hand.push(a); UI.showToast('⚠ Апокалипсис призван!'); }
      }
    }
  },

  _calcScore(ps) { return [...(ps.field.left||[]), ...(ps.field.right||[])].reduce((s,c) => s+(c.currentPower||0), 0); },

  // ── Round end ─────────────────────────────────────────────────────────────
  _endRound() {
    const g = this.game;
    const s1 = this._calcScore(g.p1);
    const s2 = this._calcScore(g.p2);
    let winner = null;
    if (s1 > s2) { g.p1.coins++; winner = 'player1'; }
    else if (s2 > s1) { g.p2.coins++; winner = 'player2'; }
    else { g.p1.coins++; g.p2.coins++; }

    for (const ps of [g.p1, g.p2]) {
      for (const r of ['left','right']) { ps.discard.push(...(ps.field[r]||[])); ps.field[r] = []; }
      ps.traps = []; ps.curses = []; ps.passed = false;
    }

    UI.onRoundEnd({ roundWinner: winner, round: g.round, nextRound: g.round + 1 });

    if (g.p1.coins >= 2 || g.p2.coins >= 2 || g.round >= 3) {
      const gameWinner = g.p1.coins > g.p2.coins ? 'player1' : g.p2.coins > g.p1.coins ? 'player2' : null;
      setTimeout(() => UI.onGameOver({ winner: gameWinner, scores: { player1: g.p1.coins, player2: g.p2.coins } }), 1500);
      return;
    }
    g.round++;
    for (const ps of [g.p1, g.p2]) { if (ps.deck.length > 0) ps.hand.push(ps.deck.shift()); }
    g.phase = 'play';
    g.turn  = winner === 'player1' ? 'p1' : winner === 'player2' ? 'p2' : 'p1';
    this._emitState();
    if (g.turn === 'p2') setTimeout(() => this._botTurn(), this.thinkDelay);
  },

  // ── Emit state to UI ──────────────────────────────────────────────────────
  _emitState() {
    const g = this.game;
    if (!g) return;
    const calcScore = (ps) => [...(ps.field.left||[]), ...(ps.field.right||[])].reduce((s,c) => s+(c.currentPower||0), 0);
    UI.render({
      gameId: g.id, round: g.round, phase: g.phase,
      myTurn: g.turn === 'p1',
      me: {
        name: g.p1.name, faction: g.p1.faction, leader: g.p1.leader, leaderUsed: g.p1.leaderUsed,
        hand: g.p1.hand, field: g.p1.field, discard: g.p1.discard, deck: g.p1.deck.length,
        score: calcScore(g.p1), coins: g.p1.coins, passed: g.p1.passed, traps: g.p1.traps||[], curses: g.p1.curses||[]
      },
      opponent: {
        name: g.p2.name, faction: g.p2.faction, leader: g.p2.leader, leaderUsed: g.p2.leaderUsed,
        handCount: g.p2.hand.length, field: g.p2.field, discard: g.p2.discard, deck: g.p2.deck.length,
        score: calcScore(g.p2), coins: g.p2.coins, passed: g.p2.passed
      }
    });
  }
};
