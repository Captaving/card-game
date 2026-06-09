const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;

// ─── Storage ─────────────────────────────────────────────────────────────────
const players = new Map();   // socketId → player
const queue   = [];          // matchmaking queue
const games   = new Map();   // gameId → game
const ratings = new Map();   // tgId → { rating, wins, losses }

// ─── HTTP + WS server ────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Lily Wars Server OK');
});
const wss = new WebSocket.Server({ server });

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => crypto.randomBytes(8).toString('hex');

function send(ws, type, payload = {}) {
  if (ws && ws.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify({ type, ...payload }));
}

function sendPlayer(pid, type, payload = {}) {
  const p = players.get(pid);
  if (p) send(p.ws, type, payload);
}

function broadcast(game, type, payload = {}) {
  sendPlayer(game.p1id, type, payload);
  sendPlayer(game.p2id, type, payload);
}

// ─── Rating ───────────────────────────────────────────────────────────────────
function getRating(tgId) {
  if (!ratings.has(tgId)) ratings.set(tgId, { rating: 1000, wins: 0, losses: 0 });
  return ratings.get(tgId);
}

function applyRating(tgId, won) {
  if (!tgId) return;
  const r = getRating(tgId);
  r.rating = Math.max(0, r.rating + (won ? 5 : -2));
  won ? r.wins++ : r.losses++;
}

// ─── Deck validation ──────────────────────────────────────────────────────────
function validateDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== 25)
    return 'Колода должна содержать ровно 25 карт';
  const counts = {};
  let inf = 0;
  for (const c of deck) {
    counts[c.id] = (counts[c.id] || 0) + 1;
    if (counts[c.id] > (c.maxInDeck || 1))
      return `Превышен лимит копий: ${c.name}`;
    inf += (c.influence || 0);
  }
  if (inf > 170) return `Превышено влияние: ${inf}/170`;
  return null;
}

// ─── Game factory ──────────────────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makePS(player) {
  const deck = shuffle(player.deck.map(c => ({
    ...c, instanceId: uid(), currentPower: c.power || 0
  })));
  const hand = deck.splice(0, 10);
  return {
    id: player.id, tgId: player.tgId, name: player.name,
    faction: player.faction, leader: player.leader,
    leaderUsed: false, leaderCountered: false, leaderCharges: null,
    deck, hand,
    field: { left: [], right: [] },
    discard: [], traps: [], curses: [],
    coins: 0, passed: false, mulliganDone: false,
  };
}

function createGame(p1id, p2id) {
  const p1 = players.get(p1id);
  const p2 = players.get(p2id);
  const id = uid();
  const game = {
    id, p1id, p2id,
    round: 1, turn: p1id, phase: 'mulligan',
    ps: { [p1id]: makePS(p1), [p2id]: makePS(p2) },
    log: [],
  };
  games.set(id, game);
  p1.gameId = id;
  p2.gameId = id;
  return game;
}

// ─── Game state view ──────────────────────────────────────────────────────────
function calcScore(ps) {
  return [...ps.field.left, ...ps.field.right]
    .reduce((s, c) => s + (c.currentPower || 0), 0);
}

function viewFor(game, pid) {
  const me  = game.ps[pid];
  const oid = pid === game.p1id ? game.p2id : game.p1id;
  const opp = game.ps[oid];
  return {
    gameId: game.id, round: game.round, phase: game.phase,
    myTurn: game.turn === pid,
    me: {
      name: me.name, faction: me.faction, leader: me.leader,
      leaderUsed: me.leaderUsed, leaderCharges: me.leaderCharges,
      hand: me.hand, field: me.field, discard: me.discard,
      deck: me.deck.length, score: calcScore(me),
      coins: me.coins, passed: me.passed,
    },
    opponent: {
      name: opp.name, faction: opp.faction, leader: opp.leader,
      leaderUsed: opp.leaderUsed,
      handCount: opp.hand.length, field: opp.field, discard: opp.discard,
      deck: opp.deck.length, score: calcScore(opp),
      coins: opp.coins, passed: opp.passed,
    },
    log: game.log.slice(-8),
  };
}

function sendState(game) {
  sendPlayer(game.p1id, 'game_state', viewFor(game, game.p1id));
  sendPlayer(game.p2id, 'game_state', viewFor(game, game.p2id));
}

// ─── Field helpers ────────────────────────────────────────────────────────────
function placeCard(ps, card, row) {
  const r = ['left', 'right'].includes(row) ? row : 'left';
  if ((ps.field[r] || []).length >= 4) return false;
  if (!card.instanceId) card.instanceId = uid();
  if (card.currentPower === undefined) card.currentPower = card.power || 0;
  ps.field[r].push(card);
  return true;
}

function findCard(ps, iid) {
  for (const r of ['left', 'right'])
    for (const c of ps.field[r])
      if (c.instanceId === iid) return c;
  return null;
}

function findCardByName(ps, name) {
  for (const r of ['left', 'right'])
    for (const c of ps.field[r])
      if (c.name === name) return c;
  return null;
}

function removeCard(ps, iid) {
  for (const r of ['left', 'right']) {
    const i = ps.field[r].findIndex(c => c.instanceId === iid);
    if (i !== -1) { ps.field[r].splice(i, 1); return true; }
  }
  return false;
}

function allCards(ps) {
  return [...ps.field.left, ...ps.field.right];
}

function randomCard(ps) {
  const all = allCards(ps);
  return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}

// ─── Buff / Damage / Destroy ──────────────────────────────────────────────────
function buffCard(game, pid, card, delta) {
  card.currentPower = (card.currentPower || 0) + delta;
  checkTraps(game, pid, card, delta);
  checkPassives(game, pid, card, delta);
}

function damageCard(game, ownerPid, card, dmg) {
  card.currentPower = Math.max(0, (card.currentPower || 0) - dmg);
  if (card.currentPower === 0) {
    const ps = game.ps[ownerPid];
    resolveOnDeath(game, ownerPid, card);
    removeCard(ps, card.instanceId);
    ps.discard.push(card);
    checkApocalypse(game, ownerPid === game.p1id ? game.p2id : game.p1id);
  }
}

function destroyCard(game, ownerPid, card) {
  const ps = game.ps[ownerPid];
  resolveOnDeath(game, ownerPid, card);
  removeCard(ps, card.instanceId);
  ps.discard.push(card);
  checkApocalypse(game, ownerPid === game.p1id ? game.p2id : game.p1id);
}

// ─── Traps ────────────────────────────────────────────────────────────────────
function checkTraps(game, buffedOwnerPid, card, delta) {
  // traps are owned by the OPPONENT (trap owner = enemy of buffed)
  const trapOwnerPid = buffedOwnerPid === game.p1id ? game.p2id : game.p1id;
  const trapOwner    = game.ps[trapOwnerPid];
  const remaining    = [];
  for (const trap of (trapOwner.traps || [])) {
    if (trap.trigger === 'enemy_buff' && trap.targetId === card.instanceId) {
      damageCard(game, buffedOwnerPid, card, trap.damage);
      game.log.push(`🪤 Ловушка: ${card.name} -${trap.damage}`);
    } else {
      remaining.push(trap);
    }
  }
  trapOwner.traps = remaining;
}

function checkPassives(game, buffedOwnerPid, card, delta) {
  // Mirror buff (Алексиос on enemy field)
  const oppPid = buffedOwnerPid === game.p1id ? game.p2id : game.p1id;
  const opp    = game.ps[oppPid];
  for (const r of ['left', 'right']) {
    for (const c of opp.field[r]) {
      if (c.effect?.action === 'mirror_buff') {
        c.currentPower += delta;
        game.log.push(`🪞 Алексиос: +${delta}`);
      }
    }
  }
  // Tарик — damage on enemy buff
  const me = game.ps[oppPid];
  for (const r of ['left', 'right']) {
    for (const c of me.field[r]) {
      if (c.effect?.action === 'damage_on_enemy_buff') {
        const target = randomCard(game.ps[buffedOwnerPid]);
        if (target) damageCard(game, buffedOwnerPid, target, c.effect.value || 2);
      }
    }
  }
}

function resolveOnDeath(game, ownerPid, card) {
  if (!card.effect || card.effect.type !== 'onDeath') return;
  const oppPid = ownerPid === game.p1id ? game.p2id : game.p1id;
  const e = card.effect;
  switch (e.action) {
    case 'summon_enemy': {
      const ghost = {
        id: 'cultists_white_08', name: 'Призрак', type: 'white',
        row: 'any', power: 1, influence: 2,
        effect: { type: 'onDeath', action: 'summon_enemy' },
        instanceId: uid(), currentPower: 1,
      };
      placeCard(game.ps[oppPid], ghost, 'left');
      game.log.push('👻 Призрак появился у противника');
      break;
    }
    case 'add_charge': {
      const wl = findCardByName(game.ps[ownerPid], 'Чернокнижник');
      if (wl) wl.charges = (wl.charges || 0) + (e.value || 1);
      break;
    }
    case 'buff': {
      const all = allCards(game.ps[ownerPid]);
      if (all.length) buffCard(game, ownerPid, all[0], e.value || 1);
      break;
    }
  }
}

function checkApocalypse(game, killerPid) {
  const ps = game.ps[killerPid];
  for (const r of ['left', 'right']) {
    const names = ps.field[r].map(c => c.name);
    if (['Война', 'Чума', 'Голод'].every(n => names.includes(n))) {
      const idx = ps.deck.findIndex(c => c.name === 'Апокалипсис');
      if (idx !== -1) {
        const apoc = ps.deck.splice(idx, 1)[0];
        ps.hand.push(apoc);
        sendPlayer(killerPid, 'card_added_to_hand', { card: apoc, reason: 'apocalypse' });
        game.log.push('💀 Апокалипсис призван!');
      }
    }
  }
}

// ─── Effect engine ────────────────────────────────────────────────────────────
function resolveEffect(game, actorPid, card, ti = {}) {
  const e   = card.effect;
  if (!e || e.type === 'passive') return;
  const me  = game.ps[actorPid];
  const oppPid = actorPid === game.p1id ? game.p2id : game.p1id;
  const opp = game.ps[oppPid];

  switch (e.action) {
    // ── Buff ────────────────────────────────────────────────────────────────
    case 'buff': {
      if (e.target === 'own_unit_selectable') {
        const t = ti.targetCardId ? findCard(me, ti.targetCardId) : null;
        if (t) buffCard(game, actorPid, t, e.value || 0);
      } else if (e.target === 'all_own') {
        allCards(me).forEach(c => buffCard(game, actorPid, c, e.value || 0));
      } else if (e.target === 'row') {
        const r = card.row !== 'any' ? card.row : (ti.row || 'left');
        (me.field[r] || []).forEach(c => buffCard(game, actorPid, c, e.value || 0));
      } else if (e.target === 'archbishop') {
        const arch = findCardByName(me, 'Архиепископ Сентор');
        if (arch) buffCard(game, actorPid, arch, e.power || 10);
      } else if (e.target === 'forest_children') {
        allCards(me).filter(c => c.name === 'Дети Леса')
          .forEach(c => buffCard(game, actorPid, c, e.value || 0));
      } else if (e.count && ti.targetCardIds) {
        for (const cid of ti.targetCardIds) {
          const t = findCard(me, cid);
          if (t) buffCard(game, actorPid, t, e.value || 0);
        }
      }
      break;
    }
    // ── Damage ──────────────────────────────────────────────────────────────
    case 'damage': {
      if (['any_enemy', 'any_enemy_selectable'].includes(e.target)) {
        const t = ti.targetCardId ? findCard(opp, ti.targetCardId) : randomCard(opp);
        if (t) damageCard(game, oppPid, t, e.value || 0);
      } else if (e.target === 'enemy_score') {
        const strongest = allCards(opp).reduce((a, b) =>
          b.currentPower > (a?.currentPower || 0) ? b : a, null);
        if (strongest) damageCard(game, oppPid, strongest, e.value || 0);
      } else if (e.target === 'any_unit_selectable') {
        const inOpp = ti.targetCardId ? findCard(opp, ti.targetCardId) : null;
        const inMe  = ti.targetCardId ? findCard(me, ti.targetCardId)  : null;
        if (inOpp) damageCard(game, oppPid, inOpp, e.value || 0);
        else if (inMe) damageCard(game, actorPid, inMe, e.value || 0);
      }
      break;
    }
    // ── Steal ───────────────────────────────────────────────────────────────
    case 'steal': {
      const t = ti.targetCardId ? findCard(opp, ti.targetCardId) : randomCard(opp);
      if (t) {
        removeCard(opp, t.instanceId);
        if (e.target === 'any_enemy_field') me.hand.push(t);
        else placeCard(me, t, ti.row || 'left');
      }
      break;
    }
    // ── Play top deck ────────────────────────────────────────────────────────
    case 'play_top_deck': {
      if (me.deck.length > 0) {
        const top = me.deck.shift();
        top.instanceId = uid(); top.currentPower = top.power || 0;
        placeCard(me, top, top.row !== 'any' ? top.row : 'left');
        resolveEffect(game, actorPid, top, {});
        game.log.push(`📥 Разведчик сыграл ${top.name} из колоды`);
      }
      break;
    }
    // ── Synergy (Братья Стали / Проклятый) ──────────────────────────────────
    case 'synergy': {
      if (e.target === 'adjacent_same_name') {
        for (const r of ['left', 'right']) {
          const idx = me.field[r].findIndex(c => c.instanceId === card.instanceId);
          if (idx !== -1) {
            [me.field[r][idx - 1], me.field[r][idx + 1]]
              .filter(c => c && c.name === card.name)
              .forEach(c => { buffCard(game, actorPid, c, e.value || 0); buffCard(game, actorPid, card, e.value || 0); });
            break;
          }
        }
      } else if (e.target === 'same_name_row') {
        for (const r of ['left', 'right']) {
          const same = me.field[r].filter(c => c.name === card.name);
          if (same.length > 1) same.forEach(c => buffCard(game, actorPid, c, e.value || 0));
        }
      }
      break;
    }
    // ── Trap ────────────────────────────────────────────────────────────────
    case 'trap': {
      const t = ti.targetCardId ? findCard(opp, ti.targetCardId) : randomCard(opp);
      if (t) {
        me.traps.push({ targetId: t.instanceId, trigger: e.trigger, damage: e.value || 3 });
        game.log.push(`🪤 Ловушка на ${t.name}`);
      }
      break;
    }
    // ── Curse ───────────────────────────────────────────────────────────────
    case 'curse': {
      const t = ti.targetCardId ? findCard(opp, ti.targetCardId) : randomCard(opp);
      if (t) {
        me.curses.push({ cardInstanceId: t.instanceId, turnsLeft: e.turns || 3, damage: e.value || 2 });
        game.log.push(`☠️ Проклятие на ${t.name}`);
      }
      break;
    }
    // ── Return to hand ───────────────────────────────────────────────────────
    case 'returnToHand': {
      const t = ti.targetCardId ? findCard(me, ti.targetCardId) : allCards(me)[0];
      if (t) { removeCard(me, t.instanceId); me.hand.push(t); }
      break;
    }
    // ── Revive ──────────────────────────────────────────────────────────────
    case 'revive': {
      const idx = ti.targetCardId
        ? me.discard.findIndex(c => c.instanceId === ti.targetCardId)
        : me.discard.findIndex(c => c.type !== 'gold' && c.type !== 'special');
      if (idx !== -1) {
        const c = me.discard.splice(idx, 1)[0];
        c.currentPower = c.power || 0;
        placeCard(me, c, c.row !== 'any' ? c.row : 'left');
      }
      break;
    }
    // ── Revive and play ──────────────────────────────────────────────────────
    case 'revive_play': {
      const idx = me.discard.findIndex(c => c.type !== 'gold' && c.type !== 'special');
      if (idx !== -1) {
        const c = me.discard.splice(idx, 1)[0];
        c.instanceId = uid(); c.currentPower = c.power || 0;
        placeCard(me, c, c.row !== 'any' ? c.row : 'left');
        resolveEffect(game, actorPid, c, {});
      }
      break;
    }
    // ── Revive + buff ────────────────────────────────────────────────────────
    case 'revive_buff': {
      const idx = ti.targetCardId
        ? me.discard.findIndex(c => c.instanceId === ti.targetCardId)
        : me.discard.findIndex(c => c.type !== 'gold' && c.type !== 'special');
      if (idx !== -1) {
        const c = me.discard.splice(idx, 1)[0];
        c.currentPower = (c.power || 0) + (e.value || 0);
        placeCard(me, c, c.row !== 'any' ? c.row : 'left');
      }
      break;
    }
    // ── Destroy ─────────────────────────────────────────────────────────────
    case 'destroy': {
      if (e.target === 'own_unit_selectable') {
        const t = ti.targetCardId ? findCard(me, ti.targetCardId) : allCards(me)[0];
        if (t) destroyCard(game, actorPid, t);
      } else if (e.target === 'any_enemy_not_gold') {
        const nonGold = allCards(opp).filter(c => c.type !== 'gold');
        const t = ti.targetCardId
          ? nonGold.find(c => c.instanceId === ti.targetCardId)
          : nonGold[0];
        if (t) destroyCard(game, oppPid, t);
      } else if (['any_enemy_selectable', 'any_unit_selectable'].includes(e.target)) {
        const tOpp = ti.targetCardId ? findCard(opp, ti.targetCardId) : null;
        const tMe  = ti.targetCardId ? findCard(me, ti.targetCardId)  : null;
        if (tOpp) destroyCard(game, oppPid, tOpp);
        else if (tMe) destroyCard(game, actorPid, tMe);
      }
      break;
    }
    // ── Summon from deck ─────────────────────────────────────────────────────
    case 'summon': {
      if (e.card) {
        for (let i = 0; i < (e.count || 1); i++) {
          const idx = me.deck.findIndex(c => c.id === e.card);
          if (idx !== -1) {
            const s = me.deck.splice(idx, 1)[0];
            s.instanceId = uid(); s.currentPower = s.power || 0;
            placeCard(me, s, s.row !== 'any' ? s.row : 'right');
          }
        }
      } else if (e.maxInfluence) {
        let placed = 0;
        for (let i = me.deck.length - 1; i >= 0 && placed < (e.count || 2); i--) {
          if (me.deck[i].influence <= e.maxInfluence) {
            const c = me.deck.splice(i, 1)[0];
            c.instanceId = uid(); c.currentPower = c.power || 0;
            placeCard(me, c, c.row !== 'any' ? c.row : 'left');
            placed++;
          }
        }
      }
      break;
    }
    // ── Steal top of enemy deck and play ────────────────────────────────────
    case 'steal_deck': {
      if (opp.deck.length > 0) {
        const top = opp.deck.shift();
        top.instanceId = uid(); top.currentPower = top.power || 0;
        placeCard(me, top, top.row !== 'any' ? top.row : 'left');
        resolveEffect(game, actorPid, top, {});
      }
      break;
    }
    // ── Consume (Чернокнижник) ───────────────────────────────────────────────
    case 'consume': {
      const wl = findCardByName(me, 'Чернокнижник');
      if (wl && wl.charges > 0 && ti.targetCardId) {
        const t = findCard(me, ti.targetCardId);
        if (t && t.instanceId !== wl.instanceId) {
          const pow = t.currentPower || 0;
          destroyCard(game, actorPid, t);
          buffCard(game, actorPid, wl, pow);
          wl.charges = Math.max(0, wl.charges - 1);
        }
      }
      break;
    }
    // ── Add charge (Ангел смерти → Чернокнижник) ────────────────────────────
    case 'add_charge': {
      const wl = findCardByName(me, 'Чернокнижник');
      if (wl) wl.charges = (wl.charges || 0) + (e.value || 1);
      break;
    }
    // ── Consume buff (Подношение Лилии) ──────────────────────────────────────
    case 'consume_buff': {
      const wl = findCardByName(me, 'Чернокнижник');
      if (wl && ti.targetCardId) {
        const t = findCard(me, ti.targetCardId);
        if (t) {
          buffCard(game, actorPid, wl, t.currentPower || 0);
          destroyCard(game, actorPid, t);
        }
      }
      break;
    }
    // ── Transform own card to Angel of Death ─────────────────────────────────
    case 'transform': {
      if (ti.targetCardId) {
        for (const r of ['left', 'right']) {
          const idx = me.field[r].findIndex(c => c.instanceId === ti.targetCardId);
          if (idx !== -1) {
            me.field[r][idx] = {
              id: 'cultists_angel', name: 'Ангел смерти', type: 'purple',
              row: 'left', power: 4, instanceId: uid(), currentPower: 4,
              effect: { type: 'onDeath', action: 'add_charge', value: 1 },
            };
            break;
          }
        }
      }
      break;
    }
    // ── Move row ─────────────────────────────────────────────────────────────
    case 'move_row': {
      if (ti.targetCardId) {
        for (const r of ['left', 'right']) {
          const idx = opp.field[r].findIndex(c => c.instanceId === ti.targetCardId);
          if (idx !== -1) {
            const moved = opp.field[r].splice(idx, 1)[0];
            placeCard(opp, moved, r === 'left' ? 'right' : 'left');
            break;
          }
        }
      }
      break;
    }
    // ── Swap enemy field with their discard ──────────────────────────────────
    case 'swap': {
      if (ti.targetCardId && ti.sourceCardId) {
        for (const r of ['left', 'right']) {
          const fi = opp.field[r].findIndex(c => c.instanceId === ti.targetCardId);
          if (fi !== -1) {
            const di = opp.discard.findIndex(c => c.instanceId === ti.sourceCardId);
            if (di !== -1) {
              const fc = opp.field[r][fi];
              const dc = opp.discard.splice(di, 1)[0];
              dc.instanceId = uid(); dc.currentPower = dc.power || 0;
              opp.field[r][fi] = dc;
              opp.discard.push(fc);
            }
            break;
          }
        }
      }
      break;
    }
    // ── Double trigger (Король Аугуст / Арториус) ────────────────────────────
    case 'double_trigger': {
      if (e.target === 'row') {
        const r = card.row !== 'any' ? card.row : (ti.row || 'left');
        for (const c of me.field[r]) {
          if (c.instanceId !== card.instanceId && c.effect?.type === 'onPlay')
            resolveEffect(game, actorPid, c, {});
        }
      } else if (ti.targetCardId) {
        const t = findCard(me, ti.targetCardId);
        if (t && t.effect?.type === 'onPlay') resolveEffect(game, actorPid, t, {});
      }
      break;
    }
    // ── Play special from deck ────────────────────────────────────────────────
    case 'play_special': {
      const idx = me.deck.findIndex(c => c.id === e.card);
      if (idx !== -1) {
        const sc = me.deck.splice(idx, 1)[0];
        sc.instanceId = uid(); sc.currentPower = sc.power || 0;
        me.discard.push(sc);
        resolveEffect(game, actorPid, sc, {});
        game.log.push(`✨ Элексир сыгран из колоды`);
      }
      break;
    }
    // ── Randomize (Кот в мешке) ───────────────────────────────────────────────
    case 'randomize_stats': {
      const [min, max] = e.powerRange || [1, 14];
      card.currentPower = Math.floor(Math.random() * (max - min + 1)) + min;
      break;
    }
    // ── Reset leader ──────────────────────────────────────────────────────────
    case 'reset_leader': {
      me.leaderUsed = false;
      game.log.push(`🔄 Лидер может использовать умение снова`);
      break;
    }
    // ── Reveal enemy hand ─────────────────────────────────────────────────────
    case 'reveal': {
      const revealed = opp.hand.slice(0, e.value || 1);
      sendPlayer(actorPid, 'reveal_cards', { cards: revealed });
      break;
    }
  }
}

// ─── Curse ticks ──────────────────────────────────────────────────────────────
function tickCurses(game) {
  for (const pid of [game.p1id, game.p2id]) {
    const ps     = game.ps[pid];
    const oppPid = pid === game.p1id ? game.p2id : game.p1id;
    const opp    = game.ps[oppPid];
    ps.curses = ps.curses.filter(curse => {
      const t = findCard(opp, curse.cardInstanceId);
      if (t) { damageCard(game, oppPid, t, curse.damage); curse.turnsLeft--; }
      else curse.turnsLeft = 0;
      return curse.turnsLeft > 0;
    });
  }
}

// ─── Leader ability ───────────────────────────────────────────────────────────
function useLeader(game, actorPid, ti = {}) {
  const me  = game.ps[actorPid];
  const oppPid = actorPid === game.p1id ? game.p2id : game.p1id;
  const opp    = game.ps[oppPid];
  const ab  = me.leader?.ability;
  if (!ab || me.leaderUsed || me.leaderCountered) return false;

  switch (ab.type) {
    case 'damage': {
      const t = ti.targetCardId ? findCard(opp, ti.targetCardId) : randomCard(opp);
      if (t) damageCard(game, oppPid, t, ab.value || 3);
      break;
    }
    case 'buff': {
      if (ab.target === 'all_own')
        allCards(me).forEach(c => buffCard(game, actorPid, c, ab.value || 1));
      break;
    }
    case 'counter': {
      opp.leaderCountered = true;
      game.log.push(`🚫 Умение лидера противника заблокировано`);
      break;
    }
    case 'summon': {
      if (!me.leaderCharges) me.leaderCharges = ab.maxUses || 3;
      if (me.leaderCharges <= 0) return false;
      const ghost = {
        id: 'ghost_leader', name: 'Призрак', type: 'white', row: 'any',
        power: 1, instanceId: uid(), currentPower: 1,
        effect: { type: 'onDeath', action: 'summon_enemy' },
      };
      placeCard(me, ghost, 'left');
      me.leaderCharges--;
      if (me.leaderCharges > 0) return 'partial'; // can use again
      break;
    }
    case 'move_unit': {
      if (!me.leaderCharges) me.leaderCharges = ab.maxUses || 3;
      if (me.leaderCharges <= 0) return false;
      if (ti.targetCardId) {
        for (const r of ['left', 'right']) {
          const idx = me.field[r].findIndex(c => c.instanceId === ti.targetCardId);
          if (idx !== -1) {
            const moved = me.field[r].splice(idx, 1)[0];
            placeCard(me, moved, r === 'left' ? 'right' : 'left');
            break;
          }
        }
      }
      me.leaderCharges--;
      if (me.leaderCharges > 0) return 'partial';
      break;
    }
    case 'play_trap': {
      const idx = me.deck.findIndex(c => c.type === 'special' && c.effect?.action === 'trap');
      if (idx !== -1) {
        const trap = me.deck.splice(idx, 1)[0];
        me.hand.push(trap);
        sendPlayer(actorPid, 'card_added_to_hand', { card: trap, reason: 'leader' });
      }
      break;
    }
    case 'returnToHand': {
      if (ti.targetCardId) {
        const idx = me.discard.findIndex(c => c.instanceId === ti.targetCardId);
        if (idx !== -1) me.hand.push(me.discard.splice(idx, 1)[0]);
      }
      break;
    }
    case 'add_charge': {
      const wl = findCardByName(me, 'Чернокнижник');
      if (wl) wl.charges = (wl.charges || 0) + 1;
      break;
    }
    case 'reveal_take': {
      const top3 = opp.deck.slice(0, 3);
      sendPlayer(actorPid, 'reveal_choose', { cards: top3 });
      break;
    }
    case 'copy': {
      const oppAbility = opp.leader?.ability;
      if (oppAbility && !opp.leaderCountered) {
        me.leader = { ...me.leader, ability: oppAbility };
        return useLeader(game, actorPid, ti);
      }
      break;
    }
  }

  me.leaderUsed = true;
  return true;
}

// ─── Round end ────────────────────────────────────────────────────────────────
function endRound(game) {
  const s1 = calcScore(game.ps[game.p1id]);
  const s2 = calcScore(game.ps[game.p2id]);

  let roundWinner = null;
  if (s1 > s2)      { game.ps[game.p1id].coins++; roundWinner = game.p1id; }
  else if (s2 > s1) { game.ps[game.p2id].coins++; roundWinner = game.p2id; }
  else              { game.ps[game.p1id].coins++; game.ps[game.p2id].coins++; }

  game.log.push(`⚔️ Раунд ${game.round}: ${s1} vs ${s2}`);

  // persist cards (Магнуссен)
  const persistIds = new Set();
  for (const pid of [game.p1id, game.p2id]) {
    for (const c of allCards(game.ps[pid]))
      if (c.effect?.action === 'persist') persistIds.add(c.instanceId);
  }

  // clear fields
  for (const pid of [game.p1id, game.p2id]) {
    const ps = game.ps[pid];
    const saved = [];
    for (const r of ['left', 'right']) {
      for (const c of ps.field[r]) {
        if (persistIds.has(c.instanceId)) saved.push({ card: c, row: r });
        else ps.discard.push(c);
      }
      ps.field[r] = [];
    }
    saved.forEach(({ card, row }) => placeCard(ps, card, row));
    ps.passed = false; ps.traps = []; ps.curses = []; ps.leaderCountered = false;
  }

  broadcast(game, 'round_end', {
    roundWinner, round: game.round,
    scores: { [game.p1id]: s1, [game.p2id]: s2 },
  });

  // check game over
  const c1 = game.ps[game.p1id].coins;
  const c2 = game.ps[game.p2id].coins;
  if (c1 >= 2 || c2 >= 2 || game.round >= 3) {
    endGame(game);
    return;
  }

  // next round
  game.round++;
  for (const pid of [game.p1id, game.p2id]) {
    const ps = game.ps[pid];
    if (ps.deck.length > 0) ps.hand.push(ps.deck.shift());
    // Гюсто auto-play in round 3
    if (game.round === 3) {
      const gi = ps.deck.findIndex(c => c.effect?.action === 'auto_play' && c.effect.round === 3);
      if (gi !== -1) {
        const g = ps.deck.splice(gi, 1)[0];
        g.instanceId = uid(); g.currentPower = g.power || 0;
        placeCard(ps, g, 'left');
      }
    }
  }

  game.phase = 'play';
  game.turn  = roundWinner || game.p1id;
  sendState(game);
}

function endGame(game) {
  game.phase = 'gameOver';
  const c1 = game.ps[game.p1id].coins;
  const c2 = game.ps[game.p2id].coins;
  let winner = c1 > c2 ? game.p1id : c2 > c1 ? game.p2id : null;

  const p1 = players.get(game.p1id);
  const p2 = players.get(game.p2id);
  applyRating(p1?.tgId, winner === game.p1id);
  applyRating(p2?.tgId, winner === game.p2id);

  broadcast(game, 'game_over', {
    winner,
    coins: { [game.p1id]: c1, [game.p2id]: c2 },
    ratings: {
      [game.p1id]: p1?.tgId ? getRating(p1.tgId) : null,
      [game.p2id]: p2?.tgId ? getRating(p2.tgId) : null,
    },
  });

  if (p1) p1.gameId = null;
  if (p2) p2.gameId = null;
  games.delete(game.id);
}

// ─── Matchmaking ──────────────────────────────────────────────────────────────
function tryMatch() {
  while (queue.length >= 2) {
    const [a, b] = queue.splice(0, 2);
    const pa = players.get(a), pb = players.get(b);
    if (!pa?.ws || pa.ws.readyState !== WebSocket.OPEN) { if (pb) queue.unshift(b); continue; }
    if (!pb?.ws || pb.ws.readyState !== WebSocket.OPEN) { queue.unshift(a); continue; }
    const game = createGame(a, b);
    send(pa.ws, 'match_found', { gameId: game.id, opponentName: pb.name, yourRole: 'player1' });
    send(pb.ws, 'match_found', { gameId: game.id, opponentName: pa.name, yourRole: 'player2' });
    sendState(game);
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────
function handleMessage(socketId, raw) {
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  const player = players.get(socketId);
  if (!player) return;
  const { type } = msg;

  switch (type) {
    case 'auth': {
      player.tgId = msg.tgId || socketId;
      player.name = msg.name || 'Player';
      const r = getRating(player.tgId);
      send(player.ws, 'auth_ok', { rating: r.rating, wins: r.wins, losses: r.losses });
      break;
    }
    case 'set_deck': {
      const err = validateDeck(msg.deck);
      if (err) { send(player.ws, 'error', { message: err }); return; }
      player.deck    = msg.deck;
      player.faction = msg.faction;
      player.leader  = msg.leader;
      send(player.ws, 'deck_ok');
      break;
    }
    case 'find_match': {
      if (!player.deck) { send(player.ws, 'error', { message: 'Нет выбранной колоды' }); return; }
      if (!queue.includes(socketId)) queue.push(socketId);
      send(player.ws, 'in_queue', { position: queue.length });
      tryMatch();
      break;
    }
    case 'cancel_queue': {
      const qi = queue.indexOf(socketId);
      if (qi !== -1) queue.splice(qi, 1);
      send(player.ws, 'queue_cancelled');
      break;
    }
    case 'mulligan': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'mulligan') return;
      const ps = game.ps[socketId];
      for (const cid of (msg.cardIds || []).slice(0, 3)) {
        const idx = ps.hand.findIndex(c => c.id === cid || c.instanceId === cid);
        if (idx !== -1 && ps.deck.length > 0) {
          ps.deck.push(ps.hand.splice(idx, 1)[0]);
          shuffle(ps.deck);
          ps.hand.push(ps.deck.shift());
        }
      }
      ps.mulliganDone = true;
      const other = game.ps[socketId === game.p1id ? game.p2id : game.p1id];
      if (other.mulliganDone) {
        game.phase = 'play';
        broadcast(game, 'game_start');
        sendState(game);
      } else {
        send(player.ws, 'mulligan_done');
      }
      break;
    }
    case 'play_card': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'play' || game.turn !== socketId) return;
      const me  = game.ps[socketId];
      const oppPid = socketId === game.p1id ? game.p2id : game.p1id;
      const opp    = game.ps[oppPid];
      if (me.passed) return;

      const { cardId, row, targetInfo: ti = {} } = msg;
      const idx = me.hand.findIndex(c => c.id === cardId || c.instanceId === cardId);
      if (idx === -1) { send(player.ws, 'error', { message: 'Карта не найдена' }); return; }

      const card = me.hand.splice(idx, 1)[0];
      card.instanceId = card.instanceId || uid();
      card.currentPower = card.power || 0;

      const isSpecial   = card.type === 'special';
      const toEnemyField = card.row === 'enemy_field';

      if (isSpecial && card.discardAfterUse !== false) {
        me.discard.push(card);
      } else if (toEnemyField) {
        if (!placeCard(opp, card, row || 'left')) {
          me.hand.push(card);
          send(player.ws, 'error', { message: 'Ряд заполнен' });
          return;
        }
      } else {
        if (!placeCard(me, card, row || (card.row !== 'any' ? card.row : 'left'))) {
          me.hand.push(card);
          send(player.ws, 'error', { message: 'Ряд заполнен (макс 4)' });
          return;
        }
      }

      resolveEffect(game, socketId, card, ti);
      tickCurses(game);

      // switch turn
      game.turn = opp.passed ? socketId : oppPid;
      if (me.passed && opp.passed) { endRound(game); return; }
      sendState(game);
      break;
    }
    case 'pass': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'play' || game.turn !== socketId) return;
      const me  = game.ps[socketId];
      const oppPid = socketId === game.p1id ? game.p2id : game.p1id;
      const opp    = game.ps[oppPid];
      me.passed = true;
      game.log.push(`${me.name} спасовал`);
      broadcast(game, 'player_passed', { pid: socketId });
      if (opp.passed) { endRound(game); return; }
      game.turn = oppPid;
      sendState(game);
      break;
    }
    case 'use_leader': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'play' || game.turn !== socketId) return;
      const me = game.ps[socketId];
      if (me.leaderUsed && me.leaderCharges === null) {
        send(player.ws, 'error', { message: 'Умение уже использовано' }); return;
      }
      const result = useLeader(game, socketId, msg.targetInfo || {});
      if (!result) { send(player.ws, 'error', { message: 'Нельзя' }); return; }
      if (result !== 'partial') {
        const oppPid = socketId === game.p1id ? game.p2id : game.p1id;
        game.turn = oppPid;
      }
      sendState(game);
      break;
    }
    case 'take_revealed_card': {
      const game = games.get(player.gameId);
      if (!game) return;
      const oppPid = socketId === game.p1id ? game.p2id : game.p1id;
      const opp    = game.ps[oppPid];
      const me     = game.ps[socketId];
      const idx    = opp.deck.findIndex(c => c.id === msg.cardId || c.instanceId === msg.cardId);
      if (idx !== -1) me.hand.push(opp.deck.splice(idx, 1)[0]);
      sendState(game);
      break;
    }
    case 'forfeit': {
      const game = games.get(player.gameId);
      if (!game) return;
      applyRating(player.tgId, false);
      const oppPid = socketId === game.p1id ? game.p2id : game.p1id;
      applyRating(players.get(oppPid)?.tgId, true);
      broadcast(game, 'game_over', {
        winner: oppPid, reason: 'forfeit',
        coins: { [game.p1id]: game.ps[game.p1id].coins, [game.p2id]: game.ps[game.p2id].coins },
      });
      player.gameId = null;
      players.get(oppPid) && (players.get(oppPid).gameId = null);
      games.delete(game.id);
      break;
    }
    case 'ping': send(player.ws, 'pong'); break;
  }
}

// ─── WS connection ────────────────────────────────────────────────────────────
wss.on('connection', ws => {
  const socketId = uid();
  players.set(socketId, { id: socketId, ws, gameId: null, deck: null, tgId: null, name: null });
  send(ws, 'connected', { socketId });

  ws.on('message', raw => handleMessage(socketId, raw.toString()));

  ws.on('close', () => {
    const player = players.get(socketId);
    if (player?.gameId) {
      const game = games.get(player.gameId);
      if (game && game.phase !== 'gameOver') {
        applyRating(player.tgId, false);
        const oppPid = socketId === game.p1id ? game.p2id : game.p1id;
        applyRating(players.get(oppPid)?.tgId, true);
        sendPlayer(oppPid, 'game_over', { winner: oppPid, reason: 'disconnect' });
        players.get(oppPid) && (players.get(oppPid).gameId = null);
        games.delete(game.id);
      }
    }
    const qi = queue.indexOf(socketId);
    if (qi !== -1) queue.splice(qi, 1);
    players.delete(socketId);
  });
});

server.listen(PORT, () => console.log(`🌸 Lily Wars server on port ${PORT}`));
