const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;

// ─── In-memory storage ───────────────────────────────────────────────────────
const players  = new Map(); // socketId → playerState
const queue    = [];        // waiting for match
const games    = new Map(); // gameId → gameState
const ratings  = new Map(); // telegramId → { rating, wins, losses }

// ─── Server setup ────────────────────────────────────────────────────────────
const SERVER_URL = 'wss://193.148.59.127:8080';
  res.writeHead(200); res.end('Lily Wars Server OK');
});
const wss = new WebSocket.Server({ server });

function uid() { return crypto.randomBytes(8).toString('hex'); }

// ─── Send helpers ────────────────────────────────────────────────────────────
function send(ws, type, payload = {}) {
  if (ws && ws.readyState === WebSocket.OPEN)
    ws.send(JSON.stringify({ type, ...payload }));
}
function broadcast(game, type, payload = {}) {
  for (const pid of [game.player1, game.player2]) {
    const p = players.get(pid);
    if (p) send(p.ws, type, payload);
  }
}
function sendBoth(game, buildPayload) {
  for (const role of ['player1', 'player2']) {
    const pid = game[role];
    const p   = players.get(pid);
    if (p) send(p.ws, 'game_state', buildPayload(role, game));
  }
}

// ─── Rating ──────────────────────────────────────────────────────────────────
function getRating(tgId) {
  if (!ratings.has(tgId)) ratings.set(tgId, { rating: 1000, wins: 0, losses: 0 });
  return ratings.get(tgId);
}
function applyResult(tgId, won) {
  const r = getRating(tgId);
  r.rating = Math.max(0, r.rating + (won ? 5 : -2));
  won ? r.wins++ : r.losses++;
}

// ─── Deck validation ─────────────────────────────────────────────────────────
function validateDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== 25) return 'Колода должна содержать ровно 25 карт';
  const counts = {};
  let totalInfluence = 0;
  for (const card of deck) {
    if (!card || !card.id) return 'Некорректная карта в колоде';
    counts[card.id] = (counts[card.id] || 0) + 1;
    if (counts[card.id] > (card.maxInDeck || 1)) return `Превышен лимит копий: ${card.name}`;
    totalInfluence += card.influence || 0;
  }
  if (totalInfluence > 170) return `Превышено влияние: ${totalInfluence}/170`;
  return null;
}

// ─── Game factory ────────────────────────────────────────────────────────────
function createGameState(p1id, p2id) {
  const p1 = players.get(p1id);
  const p2 = players.get(p2id);
  const gameId = uid();

  function buildPlayerState(p) {
    const deck = shuffle([...p.deck]);
    const hand = deck.splice(0, 10);
    return {
      id:       p.id,
      tgId:     p.tgId,
      name:     p.name,
      faction:  p.faction,
      leader:   p.leader,
      leaderUsed: false,
      deck,
      hand,
      field:    { left: [], right: [] },
      discard:  [],
      score:    0,
      coins:    0,   // rounds won
      passed:   false,
      traps:    [],  // active traps on enemy cards
      curses:   [],  // { cardInstanceId, turnsLeft, damage }
    };
  }

  const game = {
    id:       gameId,
    player1:  p1id,
    player2:  p2id,
    round:    1,
    turn:     p1id,  // who moves next
    phase:    'mulligan', // mulligan | play | roundEnd | gameOver
    p1:       buildPlayerState(p1),
    p2:       buildPlayerState(p2),
    log:      [],
  };

  games.set(gameId, game);
  p1.gameId = gameId;
  p2.gameId = gameId;
  return game;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Game state view (hide opponent hand/deck contents) ──────────────────────
function viewFor(role, game) {
  const me  = role === 'player1' ? game.p1 : game.p2;
  const opp = role === 'player1' ? game.p2 : game.p1;

  return {
    gameId:  game.id,
    round:   game.round,
    phase:   game.phase,
    myTurn:  game.turn === me.id,
    me: {
      name:        me.name,
      faction:     me.faction,
      leader:      me.leader,
      leaderUsed:  me.leaderUsed,
      hand:        me.hand,
      field:       me.field,
      discard:     me.discard,
      deck:        me.deck.length,
      score:       calcScore(me),
      coins:       me.coins,
      passed:      me.passed,
      traps:       me.traps,
      curses:      me.curses,
    },
    opponent: {
      name:        opp.name,
      faction:     opp.faction,
      leader:      opp.leader,
      leaderUsed:  opp.leaderUsed,
      handCount:   opp.hand.length,
      field:       opp.field,
      discard:     opp.discard,
      deck:        opp.deck.length,
      score:       calcScore(opp),
      coins:       opp.coins,
      passed:      opp.passed,
    },
  };
}

function calcScore(ps) {
  let s = 0;
  for (const card of [...ps.field.left, ...ps.field.right]) s += card.currentPower || card.power || 0;
  return s;
}

// ─── Effect engine ───────────────────────────────────────────────────────────
function resolveOnPlayEffect(game, actorRole, card, targetInfo) {
  const actor = actorRole === 'player1' ? game.p1 : game.p2;
  const enemy = actorRole === 'player1' ? game.p2 : game.p1;
  if (!card.effect) return;
  const e = card.effect;
  const logMsg = [];

  switch (e.action) {
    // +N power to selected own card
    case 'buff': {
      if (e.target === 'own_unit_selectable' && targetInfo?.targetCardId) {
        const t = findOnField(actor, targetInfo.targetCardId);
        if (t) { buffCard(t, e.value, 'power', actor, game, actorRole); logMsg.push(`${card.name}: +${e.value} силы → ${t.name}`); }
      } else if (e.target === 'all_own') {
        allFieldCards(actor).forEach(c => buffCard(c, e.value, 'power', actor, game, actorRole));
        logMsg.push(`${card.name}: все карты +${e.value}`);
      } else if (e.target === 'row') {
        const row = card.row !== 'any' ? card.row : (targetInfo?.row || 'left');
        (actor.field[row] || []).forEach(c => buffCard(c, e.value, 'power', actor, game, actorRole));
        logMsg.push(`${card.name}: ряд +${e.value}`);
      } else if (e.target === 'archbishop') {
        const arch = findOnFieldByName(actor, 'Архиепископ Сентор');
        if (arch) { buffCard(arch, e.power || 10, 'power', actor, game, actorRole); logMsg.push(`Покаяние: Архиепископ +${e.power}`); }
      } else if (e.target === 'adjacent') {
        const placed = findOnField(actor, card.instanceId);
        if (placed) {
          for (const row of ['left', 'right']) {
            const idx = actor.field[row].findIndex(c => c.instanceId === card.instanceId);
            if (idx !== -1) {
              if (actor.field[row][idx - 1]) buffCard(actor.field[row][idx - 1], e.value, 'power', actor, game, actorRole);
              if (actor.field[row][idx + 1]) buffCard(actor.field[row][idx + 1], e.value, 'power', actor, game, actorRole);
            }
          }
        }
      } else if (e.target === 'forest_children') {
        allFieldCards(actor).filter(c => c.name === 'Дети Леса').forEach(c => buffCard(c, e.value, 'power', actor, game, actorRole));
      }
      break;
    }
    // damage enemy card
    case 'damage': {
      if (e.target === 'any_enemy' || e.target === 'any_enemy_selectable') {
        const t = targetInfo?.targetCardId ? findOnField(enemy, targetInfo.targetCardId) : randomField(enemy);
        if (t) { damageCard(t, e.value, enemy, game); logMsg.push(`${card.name}: урон ${e.value} → ${t.name}`); }
      } else if (e.target === 'any_unit_selectable') {
        // can target own or enemy
        const tOpp = targetInfo?.targetCardId ? findOnField(enemy, targetInfo.targetCardId) : null;
        const tOwn = targetInfo?.targetCardId ? findOnField(actor, targetInfo.targetCardId) : null;
        const t = tOpp || tOwn;
        if (t) { damageCard(t, e.value, tOpp ? enemy : actor, game); logMsg.push(`${card.name}: урон ${e.value}`); }
      } else if (e.target === 'enemy_score') {
        // "bomb" damages enemy total score by reducing strongest card
        let strongest = null;
        allFieldCards(enemy).forEach(c => { if (!strongest || c.currentPower > strongest.currentPower) strongest = c; });
        if (strongest) { damageCard(strongest, e.value, enemy, game); logMsg.push(`Бомба: урон ${e.value} → ${strongest.name}`); }
      }
      break;
    }
    // steal card from enemy field to hand
    case 'steal': {
      if (e.target === 'any_enemy_field') {
        const t = targetInfo?.targetCardId ? findOnField(enemy, targetInfo.targetCardId) : randomField(enemy);
        if (t) {
          removeFromField(enemy, t.instanceId);
          actor.hand.push(t);
          logMsg.push(`${card.name}: украл ${t.name}`);
        }
      } else if (e.target === 'enemy_field_selectable') {
        const t = targetInfo?.targetCardId ? findOnField(enemy, targetInfo.targetCardId) : null;
        if (t) {
          removeFromField(enemy, t.instanceId);
          placeOnField(actor, t, targetInfo?.row || 'left');
          logMsg.push(`${card.name}: забрал ${t.name} на своё поле`);
        }
      }
      break;
    }
    // play top card from own deck
    case 'play_top_deck': {
      if (actor.deck.length > 0) {
        const top = actor.deck.shift();
        const iid = uid();
        top.instanceId = iid;
        top.currentPower = top.power;
        placeOnField(actor, top, top.row !== 'any' ? top.row : 'left');
        logMsg.push(`${card.name}: сыграл ${top.name} из колоды`);
        // Trigger that card's onPlay too (no target)
        resolveOnPlayEffect(game, actorRole, top, {});
      }
      break;
    }
    // synergy: "Братья Стали"
    case 'synergy': {
      if (e.target === 'adjacent_same_name') {
        for (const row of ['left', 'right']) {
          const idx = actor.field[row].findIndex(c => c.instanceId === card.instanceId);
          if (idx !== -1) {
            const neighbors = [actor.field[row][idx-1], actor.field[row][idx+1]].filter(c => c && c.name === card.name);
            if (neighbors.length > 0) {
              neighbors.push(actor.field[row][idx]);
              neighbors.forEach(c => buffCard(c, e.value, 'power', actor, game, actorRole));
              logMsg.push(`Братья Стали: синергия +${e.value}`);
            }
          }
        }
      }
      break;
    }
    // trap: mark enemy card — if it gets buffed, deal damage
    case 'trap': {
      if (targetInfo?.targetCardId) {
        actor.traps.push({ targetId: targetInfo.targetCardId, trigger: e.trigger, damage: e.value, trapCardName: card.name });
        logMsg.push(`${card.name}: ловушка на ${targetInfo.targetCardId}`);
      }
      break;
    }
    // curse: 2 dmg per turn for 3 turns
    case 'curse': {
      if (targetInfo?.targetCardId) {
        const t = findOnField(enemy, targetInfo.targetCardId);
        if (t) {
          actor.curses.push({ cardInstanceId: t.instanceId, turnsLeft: e.turns || 3, damage: e.value || 2 });
          logMsg.push(`${card.name}: проклятие на ${t.name}`);
        }
      }
      break;
    }
    // return own card from field to hand
    case 'returnToHand': {
      if (targetInfo?.targetCardId) {
        const t = findOnField(actor, targetInfo.targetCardId);
        if (t) {
          removeFromField(actor, t.instanceId);
          actor.hand.push(t);
          logMsg.push(`${card.name}: вернул ${t.name} в руку`);
        }
      }
      break;
    }
    // revive: bring card from discard to field
    case 'revive': {
      if (targetInfo?.targetCardId) {
        const idx = actor.discard.findIndex(c => c.instanceId === targetInfo.targetCardId);
        if (idx !== -1) {
          const revived = actor.discard.splice(idx, 1)[0];
          revived.currentPower = revived.power;
          placeOnField(actor, revived, revived.row !== 'any' ? revived.row : 'left');
          logMsg.push(`${card.name}: воскресил ${revived.name}`);
        }
      }
      break;
    }
    // revive and immediately play (Некромант)
    case 'revive_play': {
      if (targetInfo?.targetCardId) {
        const idx = actor.discard.findIndex(c => c.instanceId === targetInfo.targetCardId);
        if (idx !== -1) {
          const revived = actor.discard.splice(idx, 1)[0];
          revived.currentPower = revived.power;
          placeOnField(actor, revived, revived.row !== 'any' ? revived.row : 'left');
          resolveOnPlayEffect(game, actorRole, revived, {});
          logMsg.push(`Некромант: воскресил и сыграл ${revived.name}`);
        }
      }
      break;
    }
    // destroy own card (Тёмный маг)
    case 'destroy': {
      if (e.target === 'own_unit_selectable' && targetInfo?.targetCardId) {
        const t = findOnField(actor, targetInfo.targetCardId);
        if (t) { destroyCard(actor, t, game, actorRole === 'player1' ? 'player2' : 'player1'); logMsg.push(`${card.name}: уничтожил ${t.name}`); }
      } else if (e.target === 'any_enemy_not_gold' && targetInfo?.targetCardId) {
        const t = findOnField(enemy, targetInfo.targetCardId);
        if (t && t.type !== 'gold') { destroyCard(enemy, t, game, actorRole); logMsg.push(`${card.name}: уничтожил ${t.name}`); }
      } else if (e.target === 'any_enemy_selectable' && targetInfo?.targetCardId) {
        const t = findOnField(enemy, targetInfo.targetCardId);
        if (t) { destroyCard(enemy, t, game, actorRole); logMsg.push(`${card.name}: уничтожил ${t.name}`); }
      }
      break;
    }
    // summon card from deck
    case 'summon': {
      const summonId = e.card;
      if (e.count) {
        for (let i = 0; i < e.count; i++) {
          const idx = actor.deck.findIndex(c => c.id === summonId);
          if (idx !== -1) {
            const summoned = actor.deck.splice(idx, 1)[0];
            summoned.instanceId = uid();
            summoned.currentPower = summoned.power;
            placeOnField(actor, summoned, summoned.row !== 'any' ? summoned.row : 'right');
            logMsg.push(`${card.name}: призвал ${summoned.name}`);
          }
        }
      }
      break;
    }
    // steal from enemy deck and play
    case 'steal_deck': {
      if (enemy.deck.length > 0) {
        const top = enemy.deck.shift();
        top.instanceId = uid();
        top.currentPower = top.power;
        placeOnField(actor, top, top.row !== 'any' ? top.row : 'left');
        logMsg.push(`${card.name}: сыграл верхнюю карту противника ${top.name}`);
        resolveOnPlayEffect(game, actorRole, top, {});
      }
      break;
    }
    // re-trigger all onPlay effects in row (Король Аугуст Роззен)
    case 'double_trigger': {
      const row = card.row !== 'any' ? card.row : (targetInfo?.row || 'left');
      const rowCards = (actor.field[row] || []).filter(c => c.instanceId !== card.instanceId);
      for (const rc of rowCards) {
        if (rc.effect && rc.effect.type === 'onPlay') {
          resolveOnPlayEffect(game, actorRole, rc, {});
          logMsg.push(`${card.name}: повторил эффект ${rc.name}`);
        }
      }
      break;
    }
    // re-trigger selected card (Арториус)
    case 'double_trigger': {
      if (targetInfo?.targetCardId) {
        const t = findOnField(actor, targetInfo.targetCardId);
        if (t && t.effect?.type === 'onPlay') {
          resolveOnPlayEffect(game, actorRole, t, {});
          logMsg.push(`${card.name}: повторил эффект ${t.name}`);
        }
      }
      break;
    }
    // transform own card to Angel of Death
    case 'transform': {
      if (targetInfo?.targetCardId) {
        const idx = findOnFieldIdx(actor, targetInfo.targetCardId);
        if (idx) {
          const angel = { id: 'cultists_purple_06', name: 'Ангел смерти', type: 'purple', row: 'left', power: 4, influence: 6,
            effect: { type: 'onDeath', action: 'add_charge', target: 'warlock', value: 1 },
            instanceId: uid(), currentPower: 4 };
          actor.field[idx.row].splice(idx.index, 1, angel);
          logMsg.push(`${card.name}: трансформировал карту в Ангела Смерти`);
        }
      }
      break;
    }
    // consume: Чернокнижник — absorb adjacent card
    case 'consume': {
      if (targetInfo?.targetCardId) {
        const t = findOnField(actor, targetInfo.targetCardId);
        if (t) {
          const power = t.currentPower || t.power;
          destroyCard(actor, t, game, actorRole === 'player1' ? 'player2' : 'player1');
          buffCard(card, power, 'power', actor, game, actorRole);
          card.charges = (card.charges || 0) - 1;
          logMsg.push(`Чернокнижник: поглотил ${t.name} +${power}`);
        }
      }
      break;
    }
    // add charge to warlock
    case 'add_charge': {
      const warlock = findOnFieldByName(actor, 'Чернокнижник');
      if (warlock) { warlock.charges = (warlock.charges || 0) + (e.value || 1); logMsg.push(`+заряд Чернокнижнику`); }
      break;
    }
    // move enemy card to other row
    case 'move_row': {
      if (e.target === 'enemy_unit_selectable' && targetInfo?.targetCardId) {
        for (const row of ['left', 'right']) {
          const idx = enemy.field[row].findIndex(c => c.instanceId === targetInfo.targetCardId);
          if (idx !== -1) {
            const moved = enemy.field[row].splice(idx, 1)[0];
            const newRow = row === 'left' ? 'right' : 'left';
            placeOnField(enemy, moved, newRow);
            // trigger Лучники Долины passive
            triggerDamageOnMove(moved, enemy, game);
            logMsg.push(`${card.name}: переместил ${moved.name} в ${newRow}`);
            break;
          }
        }
      } else if (e.target === 'own_row' && targetInfo?.targetCardIds) {
        for (const cid of targetInfo.targetCardIds) {
          for (const row of ['left', 'right']) {
            const idx = actor.field[row].findIndex(c => c.instanceId === cid);
            if (idx !== -1) {
              const moved = actor.field[row].splice(idx, 1)[0];
              const newRow = row === 'left' ? 'right' : 'left';
              placeOnField(actor, moved, newRow);
              triggerDamageOnMove(moved, enemy, game);
              logMsg.push(`${card.name}: переместил ${moved.name}`);
              break;
            }
          }
        }
      }
      break;
    }
    // swap enemy field card with their discard
    case 'swap': {
      if (targetInfo?.targetCardId && targetInfo?.sourceCardId) {
        const fi = findOnFieldIdx(enemy, targetInfo.targetCardId);
        const di = enemy.discard.findIndex(c => c.instanceId === targetInfo.sourceCardId);
        if (fi && di !== -1) {
          const fieldCard = enemy.field[fi.row][fi.index];
          const discardCard = enemy.discard.splice(di, 1)[0];
          enemy.field[fi.row][fi.index] = { ...discardCard, instanceId: uid(), currentPower: discardCard.power };
          enemy.discard.push(fieldCard);
          logMsg.push(`${card.name}: заменил ${fieldCard.name} на ${discardCard.name}`);
        }
      }
      break;
    }
    // randomize stats (Кот в мешке)
    case 'randomize_stats': {
      const [min, max] = e.powerRange || [1, 14];
      card.currentPower = Math.floor(Math.random() * (max - min + 1)) + min;
      logMsg.push(`Кот в мешке: сила = ${card.currentPower}`);
      break;
    }
    // revive and buff (Индульгенция)
    case 'revive_buff': {
      if (targetInfo?.targetCardId) {
        const idx = actor.discard.findIndex(c => c.instanceId === targetInfo.targetCardId);
        if (idx !== -1) {
          const revived = actor.discard.splice(idx, 1)[0];
          revived.currentPower = revived.power + (e.value || 0);
          placeOnField(actor, revived, revived.row !== 'any' ? revived.row : 'left');
          logMsg.push(`${card.name}: воскресил ${revived.name} +${e.value}`);
        }
      }
      break;
    }
    // summon from deck by max influence (Портал)
    case 'summon': {
      if (e.maxInfluence) {
        let summoned = 0;
        for (let i = actor.deck.length - 1; i >= 0 && summoned < (e.count || 2); i--) {
          if (actor.deck[i].influence <= e.maxInfluence) {
            const c = actor.deck.splice(i, 1)[0];
            c.instanceId = uid(); c.currentPower = c.power;
            placeOnField(actor, c, c.row !== 'any' ? c.row : 'left');
            summoned++;
            logMsg.push(`Портал: призвал ${c.name}`);
          }
        }
      }
      break;
    }
    // consume own card to buff warlock (Подношение)
    case 'consume_buff': {
      const wl = findOnFieldByName(actor, 'Чернокнижник');
      if (wl && targetInfo?.targetCardId) {
        const t = findOnField(actor, targetInfo.targetCardId);
        if (t) {
          const power = t.currentPower || t.power;
          destroyCard(actor, t, game, actorRole === 'player1' ? 'player2' : 'player1');
          buffCard(wl, power, 'power', actor, game, actorRole);
          logMsg.push(`Подношение: +${power} Чернокнижнику`);
        }
      }
      break;
    }
    // reset leader ability
    case 'reset_leader': {
      actor.leaderUsed = false;
      logMsg.push(`${card.name}: лидер может использовать умение снова`);
      break;
    }
    // Buff 3 own cards (Порошок Ангилеи)
    case 'buff': {
      if (e.count && targetInfo?.targetCardIds) {
        for (const cid of (targetInfo.targetCardIds || [])) {
          const t = findOnField(actor, cid);
          if (t) buffCard(t, e.value, 'power', actor, game, actorRole);
        }
      }
      break;
    }
    // Инквизиция: destroy any card
    case 'destroy': {
      if (e.special === 'indulgence' && targetInfo?.targetCardId) {
        const inOwnField = findOnField(actor, targetInfo.targetCardId);
        const inEnemyField = findOnField(enemy, targetInfo.targetCardId);
        if (inOwnField) {
          destroyCard(actor, inOwnField, game, actorRole === 'player1' ? 'player2' : 'player1');
          // Play Индульгенция if available
          const indIdx = actor.deck.findIndex(c => c.name === 'Индульгенция');
          if (indIdx !== -1) {
            const ind = actor.deck.splice(indIdx, 1)[0];
            send(players.get(actor.id)?.ws, 'play_special_prompt', { card: ind });
          }
        } else if (inEnemyField) {
          destroyCard(enemy, inEnemyField, game, actorRole);
        }
      }
      break;
    }
    // reveal enemy hand cards
    case 'reveal': {
      const revealCount = Math.min(e.value || 1, enemy.hand.length);
      const revealed = enemy.hand.slice(0, revealCount);
      send(players.get(actor.id)?.ws, 'reveal_cards', { cards: revealed, source: 'hand' });
      logMsg.push(`${card.name}: раскрыл ${revealCount} карт противника`);
      break;
    }
    case 'reveal_take': {
      const top3 = enemy.deck.slice(0, 3);
      send(players.get(actor.id)?.ws, 'reveal_choose', { cards: top3, source: 'deck' });
      logMsg.push(`${card.name}: посмотрел 3 карты из колоды противника`);
      break;
    }
  }

  if (logMsg.length) game.log.push(...logMsg);
}

// ─── Death triggers ──────────────────────────────────────────────────────────
function resolveOnDeathEffect(game, ownerRole, card) {
  const owner = ownerRole === 'player1' ? game.p1 : game.p2;
  const enemy = ownerRole === 'player1' ? game.p2 : game.p1;
  if (!card.effect || card.effect.type !== 'onDeath') return;
  const e = card.effect;

  switch (e.action) {
    case 'buff': {
      if (e.target === 'any_unit') {
        // buff first own field card or enemy if empty
        const targets = allFieldCards(owner);
        if (targets.length) buffCard(targets[0], e.value, e.stat, owner, game, ownerRole);
      }
      break;
    }
    case 'summon_enemy': {
      // ghost appears on enemy field
      const ghost = { id: 'cultists_white_08', name: 'Призрак', type: 'white', row: 'any', power: 1, influence: 2,
        effect: { type: 'onDeath', action: 'summon_enemy', card: 'cultists_white_08' },
        instanceId: uid(), currentPower: 1 };
      placeOnField(enemy, ghost, 'left');
      game.log.push(`Призрак появился на поле противника`);
      break;
    }
    case 'add_charge': {
      const warlock = findOnFieldByName(owner, 'Чернокнижник');
      if (warlock) warlock.charges = (warlock.charges || 0) + (e.value || 1);
      break;
    }
  }
}

// ─── Passive checks ──────────────────────────────────────────────────────────
function checkPassiveTriggers(game, ownerRole, buffedCard, delta) {
  const owner  = ownerRole === 'player1' ? game.p1 : game.p2;
  const enemy  = ownerRole === 'player1' ? game.p2 : game.p1;
  const oppRole = ownerRole === 'player1' ? 'player2' : 'player1';

  // Check opponent traps on this card
  for (const trap of enemy.traps) {
    if (trap.trigger === 'enemy_buff' && trap.targetId === buffedCard.instanceId) {
      damageCard(buffedCard, trap.damage, owner, game);
      game.log.push(`Ловушка сработала: ${buffedCard.name} получил ${trap.damage} урона`);
    }
  }
  // Remove spent traps (one-time)
  enemy.traps = enemy.traps.filter(t => !(t.trigger === 'enemy_buff' && t.targetId === buffedCard.instanceId));

  // Магистр Ордена: if this card got buffed, it damages random enemy
  for (const row of ['left', 'right']) {
    for (const card of owner.field[row]) {
      if (card.effect?.action === 'damage_on_buff' && card.instanceId !== buffedCard.instanceId) {
        const target = randomField(enemy);
        if (target) { damageCard(target, card.effect.value, enemy, game); game.log.push(`Магистр Ордена: урон ${target.name}`); }
      }
    }
  }

  // Чародей Алексиос on enemy field: mirrors buff
  for (const row of ['left', 'right']) {
    for (const card of enemy.field[row]) {
      if (card.effect?.action === 'mirror_buff') {
        buffCard(card, delta, 'power', enemy, game, oppRole);
        game.log.push(`Чародей Алексиос: зеркало +${delta}`);
      }
    }
  }

  // Тарик Стрелок: if enemy card gets buffed, deal 2 damage
  for (const row of ['left', 'right']) {
    for (const card of enemy.field[row]) {
      if (card.effect?.action === 'damage_on_enemy_buff') {
        // enemy here is the one who owns Тарик — so if owner got buffed, enemy's Тарик fires
        damageCard(buffedCard, card.effect.value, owner, game);
        game.log.push(`Тарик: урон ${card.effect.value} → ${buffedCard.name}`);
      }
    }
  }
}

function triggerDamageOnMove(movedCard, enemy, game) {
  // Лучники Долины: when moved, deal 2 to any enemy
  if (movedCard.effect?.action === 'damage_on_move') {
    const target = randomField(enemy);
    if (target) { damageCard(target, movedCard.effect.value, enemy, game); }
  }
  // Дриада: when buffed/moved, move one own card
  // handled at client prompt level
}

// ─── Field helpers ───────────────────────────────────────────────────────────
function placeOnField(ps, card, row) {
  const r = (['left','right'].includes(row)) ? row : 'left';
  if (!ps.field[r]) ps.field[r] = [];
  if (ps.field[r].length >= 4) return false; // max 4 per row
  if (!card.instanceId) card.instanceId = uid();
  if (card.currentPower === undefined) card.currentPower = card.power || 0;
  ps.field[r].push(card);
  return true;
}

function findOnField(ps, instanceId) {
  for (const row of ['left','right'])
    for (const c of ps.field[row])
      if (c.instanceId === instanceId) return c;
  return null;
}

function findOnFieldIdx(ps, instanceId) {
  for (const row of ['left','right']) {
    const index = ps.field[row].findIndex(c => c.instanceId === instanceId);
    if (index !== -1) return { row, index };
  }
  return null;
}

function findOnFieldByName(ps, name) {
  for (const row of ['left','right'])
    for (const c of ps.field[row])
      if (c.name === name) return c;
  return null;
}

function removeFromField(ps, instanceId) {
  for (const row of ['left','right']) {
    const idx = ps.field[row].findIndex(c => c.instanceId === instanceId);
    if (idx !== -1) { ps.field[row].splice(idx, 1); return true; }
  }
  return false;
}

function allFieldCards(ps) {
  return [...ps.field.left, ...ps.field.right];
}

function randomField(ps) {
  const all = allFieldCards(ps);
  return all.length ? all[Math.floor(Math.random() * all.length)] : null;
}

function buffCard(card, delta, stat, ownerPs, game, ownerRole) {
  card.currentPower = (card.currentPower || 0) + delta;
  checkPassiveTriggers(game, ownerRole, card, delta);
  // Дриада passive: on buff, move a card
  if (card.effect?.action === 'move_on_buff') {
    // signal client to choose card to move
    const p = players.get(ownerPs.id)?.ws;
    send(p, 'choose_move', { reason: 'dryad_buff', cardId: card.instanceId });
  }
}

function damageCard(card, dmg, ownerPs, game) {
  card.currentPower = Math.max(0, (card.currentPower || 0) - dmg);
  if (card.currentPower === 0) {
    const ownerRole = game.p1.id === ownerPs.id ? 'player1' : 'player2';
    resolveOnDeathEffect(game, ownerRole, card);
    removeFromField(ownerPs, card.instanceId);
    ownerPs.discard.push(card);
    // Check apocalypse combo after death
    checkApocalypseCombo(game, ownerRole === 'player1' ? 'player2' : 'player1');
  }
}

function destroyCard(ownerPs, card, game, killerRole) {
  const ownerRole = game.p1.id === ownerPs.id ? 'player1' : 'player2';
  resolveOnDeathEffect(game, ownerRole, card);
  removeFromField(ownerPs, card.instanceId);
  ownerPs.discard.push(card);
  checkApocalypseCombo(game, killerRole);
}

// ─── Apocalypse combo check ──────────────────────────────────────────────────
function checkApocalypseCombo(game, ownerRole) {
  const owner = ownerRole === 'player1' ? game.p1 : game.p2;
  const needed = ['Война','Чума','Голод','Смерть'];
  const fieldNames = allFieldCards(owner).map(c => c.name);
  // Need Война, Чума, Голод in same row
  for (const row of ['left','right']) {
    const rowNames = owner.field[row].map(c => c.name);
    if (['Война','Чума','Голод'].every(n => rowNames.includes(n))) {
      // summon Апокалипсис from deck
      const idx = owner.deck.findIndex(c => c.name === 'Апокалипсис');
      if (idx !== -1) {
        const apoc = owner.deck.splice(idx, 1)[0];
        owner.hand.push(apoc);
        game.log.push(`Апокалипсис призван в руку!`);
        const p = players.get(owner.id)?.ws;
        send(p, 'card_added_to_hand', { card: apoc, reason: 'apocalypse_combo' });
      }
    }
  }
}

// ─── Turn processing ─────────────────────────────────────────────────────────
function processCurses(game) {
  for (const ps of [game.p1, game.p2]) {
    const toRemove = [];
    for (const curse of ps.curses) {
      const card = findOnField(ps, curse.cardInstanceId);
      if (card) { damageCard(card, curse.damage, ps, game); curse.turnsLeft--; }
      else curse.turnsLeft = 0;
      if (curse.turnsLeft <= 0) toRemove.push(curse);
    }
    ps.curses = ps.curses.filter(c => !toRemove.includes(c));
  }
}

function processPassiveBuffsPerTurn(game, currentTurnRole) {
  // Альмерия Франкен: gains +1 in hand after enemy turn
  const waitingRole = currentTurnRole === 'player1' ? 'player2' : 'player1';
  const waiting = waitingRole === 'player1' ? game.p1 : game.p2;
  for (const card of waiting.hand) {
    if (card.effect?.action === 'buff_per_turn' && card.effect.trigger === 'enemy_turn') {
      card.currentPower = (card.currentPower || card.power) + card.effect.value;
      game.log.push(`Альмерия: +${card.effect.value} в руке`);
    }
    // Саллия: +2 per trap played — handled at trap play time
  }
}

function processSallia(game, actorRole) {
  const actor = actorRole === 'player1' ? game.p1 : game.p2;
  for (const card of actor.hand) {
    if (card.effect?.action === 'buff_per_trap') {
      card.currentPower = (card.currentPower || card.power) + (card.effect.value || 2);
    }
  }
}

// ─── Round end ───────────────────────────────────────────────────────────────
function endRound(game) {
  const s1 = calcScore(game.p1);
  const s2 = calcScore(game.p2);

  let roundWinner = null;
  if (s1 > s2)      { game.p1.coins++; roundWinner = 'player1'; }
  else if (s2 > s1) { game.p2.coins++; roundWinner = 'player2'; }
  else              { game.p1.coins++; game.p2.coins++; } // draw = both get coin

  game.log.push(`Раунд ${game.round} завершён. Счёт: ${s1}:${s2}`);

  // Move all field cards to discard
  for (const ps of [game.p1, game.p2]) {
    for (const row of ['left','right']) {
      ps.discard.push(...ps.field[row]);
      ps.field[row] = [];
    }
    ps.traps = [];
    ps.curses = [];
    ps.passed = false;
  }

  // Check game over
  if (game.p1.coins >= 2 || game.p2.coins >= 2 || game.round >= 3) {
    endGame(game);
    return;
  }

  // Next round
  game.round++;
  // Deal 1 card each
  for (const ps of [game.p1, game.p2]) {
    if (ps.deck.length > 0) ps.hand.push(ps.deck.shift());
  }

  // Гюсто auto-play in round 3
  if (game.round === 3) {
    for (const [role, ps] of [['player1', game.p1], ['player2', game.p2]]) {
      for (const card of [...ps.hand, ...ps.deck]) {
        if (card.effect?.action === 'auto_play' && card.effect.round === 3) {
          const idx = ps.hand.indexOf(card);
          if (idx !== -1) ps.hand.splice(idx, 1);
          else { const di = ps.deck.indexOf(card); if (di !== -1) ps.deck.splice(di, 1); }
          card.instanceId = uid(); card.currentPower = card.power;
          placeOnField(ps, card, 'left');
          game.log.push(`Гюсто автоматически вышел на поле`);
          break;
        }
      }
    }
  }

  // Чародей Магнуссен stays on field (persist) — already handled by not clearing

  game.phase = 'play';
  game.turn = roundWinner ? (roundWinner === 'player1' ? game.p1.id : game.p2.id) : game.turn;

  broadcast(game, 'round_end', { roundWinner, round: game.round - 1, nextRound: game.round });
  sendBoth(game, viewFor);
}

function endGame(game) {
  game.phase = 'gameOver';
  let winner = null;
  if (game.p1.coins > game.p2.coins)       winner = 'player1';
  else if (game.p2.coins > game.p1.coins)  winner = 'player2';

  const p1 = players.get(game.player1);
  const p2 = players.get(game.player2);

  if (p1?.tgId && p2?.tgId) {
    applyResult(p1.tgId, winner === 'player1');
    applyResult(p2.tgId, winner === 'player2');
  }

  broadcast(game, 'game_over', {
    winner,
    scores:  { player1: game.p1.coins, player2: game.p2.coins },
    ratings: { player1: p1?.tgId ? getRating(p1.tgId) : null, player2: p2?.tgId ? getRating(p2.tgId) : null }
  });

  // Cleanup
  if (p1) p1.gameId = null;
  if (p2) p2.gameId = null;
  games.delete(game.id);
}

// ─── Matchmaking ─────────────────────────────────────────────────────────────
function tryMatch() {
  while (queue.length >= 2) {
    const a = queue.shift();
    const b = queue.shift();
    const pa = players.get(a);
    const pb = players.get(b);
    if (!pa || !pb || pa.ws.readyState !== WebSocket.OPEN || pb.ws.readyState !== WebSocket.OPEN) {
      if (pa && pa.ws.readyState === WebSocket.OPEN) queue.unshift(a);
      if (pb && pb.ws.readyState === WebSocket.OPEN) queue.unshift(b);
      continue;
    }
    const game = createGameState(a, b);
    send(pa.ws, 'match_found', { gameId: game.id, opponentName: pb.name, yourRole: 'player1' });
    send(pb.ws, 'match_found', { gameId: game.id, opponentName: pa.name, yourRole: 'player2' });
    sendBoth(game, viewFor);
  }
}

// ─── Message handler ─────────────────────────────────────────────────────────
function handleMessage(socketId, msg) {
  let data;
  try { data = JSON.parse(msg); } catch { return; }

  const { type } = data;
  const player = players.get(socketId);
  if (!player) return;

  switch (type) {
    // ── Auth / setup ──────────────────────────────────────────────────────────
    case 'auth': {
      player.tgId  = data.tgId || socketId;
      player.name  = data.name || 'Player';
      const r = getRating(player.tgId);
      send(player.ws, 'auth_ok', { rating: r.rating, wins: r.wins, losses: r.losses });
      break;
    }
    case 'set_deck': {
      const err = validateDeck(data.deck);
      if (err) { send(player.ws, 'error', { message: err }); return; }
      player.deck    = data.deck;
      player.faction = data.faction;
      player.leader  = data.leader;
      send(player.ws, 'deck_ok');
      break;
    }

    // ── Matchmaking ───────────────────────────────────────────────────────────
    case 'find_match': {
      if (!player.deck) { send(player.ws, 'error', { message: 'Выберите колоду' }); return; }
      if (!queue.includes(socketId)) queue.push(socketId);
      send(player.ws, 'in_queue', { position: queue.indexOf(socketId) + 1 });
      tryMatch();
      break;
    }
    case 'cancel_queue': {
      const qi = queue.indexOf(socketId);
      if (qi !== -1) queue.splice(qi, 1);
      send(player.ws, 'queue_cancelled');
      break;
    }

    // ── Mulligan ──────────────────────────────────────────────────────────────
    case 'mulligan': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'mulligan') return;
      const role = game.player1 === socketId ? 'player1' : 'player2';
      const ps   = role === 'player1' ? game.p1 : game.p2;

      const toSwap = (data.cardIds || []).slice(0, 3);
      for (const cid of toSwap) {
        const idx = ps.hand.findIndex(c => c.id === cid || c.instanceId === cid);
        if (idx !== -1 && ps.deck.length > 0) {
          ps.deck.push(ps.hand.splice(idx, 1)[0]);
          shuffle(ps.deck);
          ps.hand.push(ps.deck.shift());
        }
      }
      ps.mulliganDone = true;

      if (game.p1.mulliganDone && game.p2.mulliganDone) {
        game.phase = 'play';
        broadcast(game, 'game_start');
        sendBoth(game, viewFor);
      } else {
        send(player.ws, 'mulligan_done');
      }
      break;
    }

    // ── Play card ─────────────────────────────────────────────────────────────
    case 'play_card': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'play') return;
      const role = game.player1 === socketId ? 'player1' : 'player2';
      const ps   = role === 'player1' ? game.p1 : game.p2;
      if (game.turn !== socketId) { send(player.ws, 'error', { message: 'Не ваш ход' }); return; }
      if (ps.passed) { send(player.ws, 'error', { message: 'Вы спасовали' }); return; }

      const { cardId, row, targetInfo } = data;
      const cardIdx = ps.hand.findIndex(c => c.id === cardId || c.instanceId === cardId);
      if (cardIdx === -1) { send(player.ws, 'error', { message: 'Карта не найдена в руке' }); return; }

      const card = ps.hand.splice(cardIdx, 1)[0];
      card.instanceId = card.instanceId || uid();
      card.currentPower = card.power || 0;

      const isSpecial = card.type === 'special';
      const targetRow = row || (card.row !== 'any' ? card.row : 'left');
      const isEnemyField = card.row === 'enemy_field';

      if (isSpecial && card.discardAfterUse) {
        ps.discard.push(card);
      } else if (isEnemyField) {
        const enemy = role === 'player1' ? game.p2 : game.p1;
        placeOnField(enemy, card, targetRow);
      } else if (!isSpecial || !card.discardAfterUse) {
        const placed = placeOnField(ps, card, targetRow);
        if (!placed) { ps.hand.push(card); send(player.ws, 'error', { message: 'Ряд заполнен (макс 4)' }); return; }
      }

      // Resolve effect
      resolveOnPlayEffect(game, role, card, targetInfo || {});

      // Special: play card from deck triggered by Чародей Света
      if (card.effect?.action === 'play_special' && card.effect.card) {
        const si = ps.deck.findIndex(c => c.id === card.effect.card);
        if (si !== -1) {
          const sc = ps.deck.splice(si, 1)[0];
          sc.instanceId = uid(); sc.currentPower = sc.power;
          ps.discard.push(sc);
          resolveOnPlayEffect(game, role, sc, {});
          game.log.push(`${card.name}: сыграл ${sc.name} из колоды`);
        }
      }

      // Салия buff per trap
      if (isSpecial && card.effect?.action === 'trap') processSallia(game, role);

      // Process curses tick
      processCurses(game);
      processPassiveBuffsPerTurn(game, role);

      // Check synergies on field
      checkFieldSynergies(game, role);

      // Switch turn
      const oppId = role === 'player1' ? game.player2 : game.player1;
      const opp   = role === 'player1' ? game.p2 : game.p1;
      game.turn = opp.passed ? socketId : oppId;

      // Check if both passed
      if (ps.passed && opp.passed) { endRound(game); return; }

      sendBoth(game, viewFor);
      break;
    }

    // ── Pass ──────────────────────────────────────────────────────────────────
    case 'pass': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'play') return;
      const role = game.player1 === socketId ? 'player1' : 'player2';
      const ps   = role === 'player1' ? game.p1 : game.p2;
      const opp  = role === 'player1' ? game.p2 : game.p1;
      if (game.turn !== socketId) return;

      ps.passed = true;
      game.log.push(`${ps.name} спасовал`);
      broadcast(game, 'player_passed', { role });

      if (opp.passed) { endRound(game); return; }
      game.turn = opp.id;
      sendBoth(game, viewFor);
      break;
    }

    // ── Leader ability ────────────────────────────────────────────────────────
    case 'use_leader': {
      const game = games.get(player.gameId);
      if (!game || game.phase !== 'play') return;
      const role = game.player1 === socketId ? 'player1' : 'player2';
      const ps   = role === 'player1' ? game.p1 : game.p2;
      if (ps.leaderUsed) { send(player.ws, 'error', { message: 'Умение лидера уже использовано' }); return; }
      if (game.turn !== socketId) { send(player.ws, 'error', { message: 'Не ваш ход' }); return; }

      const { ability } = ps.leader;
      const { targetInfo } = data;
      const enemy = role === 'player1' ? game.p2 : game.p1;

      switch (ability.type) {
        case 'damage': {
          const t = targetInfo?.targetCardId ? findOnField(enemy, targetInfo.targetCardId) : randomField(enemy);
          if (t) { damageCard(t, ability.value, enemy, game); game.log.push(`Лидер: урон ${ability.value} → ${t.name}`); }
          break;
        }
        case 'buff': {
          if (ability.target === 'all_own') allFieldCards(ps).forEach(c => buffCard(c, ability.value, 'power', ps, game, role));
          break;
        }
        case 'counter': {
          // cancel opponent leader — mark it
          enemy.leaderCountered = true;
          game.log.push(`Лидер: умение противника отменено`);
          break;
        }
        case 'summon': {
          if (ability.maxUses) {
            if (!ps.leaderCharges) ps.leaderCharges = ability.maxUses;
            if (ps.leaderCharges <= 0) { send(player.ws, 'error', { message: 'Нет зарядов' }); return; }
            ps.leaderCharges--;
            const ghost = { id: 'cultists_white_08', name: 'Призрак', type: 'white', row: 'any', power: 1, influence: 2,
              effect: { type: 'onDeath', action: 'summon_enemy' }, instanceId: uid(), currentPower: 1 };
            placeOnField(ps, ghost, 'left');
            if (ps.leaderCharges > 0) { ps.leaderUsed = false; } // Can reuse
          }
          break;
        }
        case 'move_unit': {
          if (!ps.leaderCharges) ps.leaderCharges = ability.maxUses || 3;
          if (ps.leaderCharges <= 0) { send(player.ws, 'error', { message: 'Нет зарядов' }); return; }
          ps.leaderCharges--;
          if (targetInfo?.targetCardId) {
            for (const row of ['left','right']) {
              const idx = ps.field[row].findIndex(c => c.instanceId === targetInfo.targetCardId);
              if (idx !== -1) {
                const moved = ps.field[row].splice(idx, 1)[0];
                const newRow = row === 'left' ? 'right' : 'left';
                placeOnField(ps, moved, newRow);
                triggerDamageOnMove(moved, enemy, game);
                break;
              }
            }
          }
          if (ps.leaderCharges > 0) ps.leaderUsed = false;
          break;
        }
        case 'play_trap': {
          const trapIdx = ps.deck.findIndex(c => c.type === 'special' && c.effect?.action === 'trap');
          if (trapIdx !== -1) {
            const trap = ps.deck.splice(trapIdx, 1)[0];
            ps.hand.push(trap);
            send(player.ws, 'card_added_to_hand', { card: trap, reason: 'leader' });
          }
          break;
        }
        case 'returnToHand': {
          if (targetInfo?.targetCardId) {
            const idx = ps.discard.findIndex(c => c.instanceId === targetInfo.targetCardId);
            if (idx !== -1) { ps.hand.push(ps.discard.splice(idx, 1)[0]); game.log.push(`Лидер: вернул карту из отбоя`); }
          }
          break;
        }
        case 'add_charge': {
          const wl = findOnFieldByName(ps, 'Чернокнижник');
          if (wl) { wl.charges = (wl.charges || 0) + 1; game.log.push(`Лидер: +заряд Чернокнижнику`); }
          break;
        }
        case 'copy': {
          // Copies opponent leader ability — just use it
          if (!enemy.leaderCountered) {
            const fakeLeader = { leader: { ability: enemy.leader.ability } };
            // Re-invoke with opponent ability
            handleMessage(socketId, JSON.stringify({ type: 'use_leader', ...data, _copied: true }));
            return;
          }
          break;
        }
        case 'reveal_take': {
          const top3 = enemy.deck.slice(0, 3);
          send(player.ws, 'reveal_choose', { cards: top3, source: 'deck' });
          break;
        }
        case 'damage': {
          if (targetInfo?.targetCardId) {
            const t = findOnField(enemy, targetInfo.targetCardId);
            if (t) damageCard(t, ability.value, enemy, game);
          }
          break;
        }
      }

      ps.leaderUsed = true;

      // Switch turn
      const oppId = role === 'player1' ? game.player2 : game.player1;
      game.turn = oppId;
      sendBoth(game, viewFor);
      break;
    }

    // ── Take card from reveal ─────────────────────────────────────────────────
    case 'take_revealed_card': {
      const game = games.get(player.gameId);
      if (!game) return;
      const role = game.player1 === socketId ? 'player1' : 'player2';
      const ps   = role === 'player1' ? game.p1 : game.p2;
      const enemy = role === 'player1' ? game.p2 : game.p1;
      const { cardId } = data;
      const idx = enemy.deck.findIndex(c => c.id === cardId || c.instanceId === cardId);
      if (idx !== -1) {
        const card = enemy.deck.splice(idx, 1)[0];
        ps.hand.push(card);
        game.log.push(`Взял карту из колоды противника: ${card.name}`);
      }
      sendBoth(game, viewFor);
      break;
    }

    // ── Forfeit ───────────────────────────────────────────────────────────────
    case 'forfeit': {
      const game = games.get(player.gameId);
      if (!game) return;
      const role = game.player1 === socketId ? 'player1' : 'player2';

      if (player.tgId) applyResult(player.tgId, false);
      const oppId   = role === 'player1' ? game.player2 : game.player1;
      const oppPlayer = players.get(oppId);
      if (oppPlayer?.tgId) applyResult(oppPlayer.tgId, true);

      broadcast(game, 'game_over', {
        winner: role === 'player1' ? 'player2' : 'player1',
        reason: 'forfeit',
        scores:  { player1: game.p1.coins, player2: game.p2.coins },
      });
      if (oppPlayer) oppPlayer.gameId = null;
      player.gameId = null;
      games.delete(game.id);
      break;
    }

    // ── Ping ─────────────────────────────────────────────────────────────────
    case 'ping': send(player.ws, 'pong'); break;
  }
}

// ─── Field synergies ─────────────────────────────────────────────────────────
function checkFieldSynergies(game, role) {
  const ps = role === 'player1' ? game.p1 : game.p2;
  for (const row of ['left','right']) {
    // Дети Леса
    const childrenOfForest = ps.field[row].filter(c => c.name === 'Дети Леса');
    if (childrenOfForest.length === 2) {
      childrenOfForest.forEach(c => { if ((c.synergyApplied || 0) < 1) { c.currentPower += 4; c.synergyApplied = (c.synergyApplied || 0) + 1; } });
    }
    // Элиона + Лучники Долины synergy on enemy death handled separately
  }
}

// ─── WebSocket connection ─────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  const socketId = uid();
  players.set(socketId, { id: socketId, ws, gameId: null, deck: null });

  send(ws, 'connected', { socketId });

  ws.on('message', (msg) => handleMessage(socketId, msg.toString()));

  ws.on('close', () => {
    const player = players.get(socketId);
    if (player?.gameId) {
      const game = games.get(player.gameId);
      if (game && game.phase !== 'gameOver') {
        // Treat as forfeit
        if (player.tgId) applyResult(player.tgId, false);
        const role    = game.player1 === socketId ? 'player1' : 'player2';
        const oppId   = role === 'player1' ? game.player2 : game.player1;
        const oppPlayer = players.get(oppId);
        if (oppPlayer?.tgId) applyResult(oppPlayer.tgId, true);
        send(oppPlayer?.ws, 'game_over', {
          winner: role === 'player1' ? 'player2' : 'player1',
          reason: 'disconnect',
          scores: { player1: game.p1.coins, player2: game.p2.coins },
        });
        if (oppPlayer) oppPlayer.gameId = null;
        games.delete(player.gameId);
      }
    }
    // Remove from queue
    const qi = queue.indexOf(socketId);
    if (qi !== -1) queue.splice(qi, 1);
    players.delete(socketId);
  });
});

server.listen(PORT, () => console.log(`Lily Wars server running on port ${PORT}`));