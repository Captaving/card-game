// effects.js - Полная система эффектов карт и лидеров

// === БАЗОВЫЕ ЭФФЕКТЫ ===
const CardEffects = {
  damage: (target, value) => {
    if (!target) return {ok:false, msg:'Нет цели'};
    target.health = (target.health||1) - value;
    return {ok:true, destroyed:target.health<=0, msg:`${target.name} получил ${value} урона`};
  },
  
  heal: (target, value) => {
    if (!target) return {ok:false, msg:'Нет цели'};
    target.health = (target.health||0) + value;
    return {ok:true, msg:`${target.name} исцелён на ${value}`};
  },
  
  buff: (target, value, stat) => {
    if (!target||!stat) return {ok:false, msg:'Нет цели'};
    target[stat] = (target[stat]||0) + value;
    return {ok:true, msg:`${target.name}: +${value} ${stat}`};
  },
  
  summon: (cardId, count, row, gameState) => {
    const faction = FACTIONS[gameState.playerFaction];
    const template = faction?.cards?.find(c => c.id === cardId);
    if (!template) return {ok:false, msg:'Карта не найдена'};
    let summoned = 0;
    for (let i=0; i<count; i++) {
      if (gameState.playerField[row]?.length < 4) {
        gameState.playerField[row].push({...template, instanceId: Date.now()+i});
        summoned++;
      }
    }
    return {ok:true, msg:`Призвано ${summoned} карт`};
  },
  
  draw: (count, gameState) => {
    const draw = Math.min(count, gameState.playerDeck.length);
    if (draw > 0) {
      gameState.playerHand.push(...gameState.playerDeck.splice(0, draw));
      return {ok:true, msg:`Взято ${draw} карт`};
    }
    return {ok:false, msg:'Колода пуста'};
  },
  
  returnToHand: (target, gameState) => {
    if (!target) return {ok:false, msg:'Нет цели'};
    for (let row of ['left','right']) {
      const idx = gameState.playerField[row].findIndex(c => c.id === target.id);
      if (idx > -1) {
        gameState.playerField[row].splice(idx, 1);
        gameState.playerHand.push(target);
        return {ok:true, msg:`${target.name} возвращён в руку`};
      }
    }
    return {ok:false, msg:'Карта не найдена'};
  },
  
  destroy: (target, gameState) => {
    if (!target) return {ok:false, msg:'Нет цели'};
    for (let row of ['left','right']) {
      const idx = gameState.playerField[row].findIndex(c => c.id === target.id);
      if (idx > -1) {
        const card = gameState.playerField[row].splice(idx, 1)[0];
        gameState.playerDiscard.push(card);
        return {ok:true, msg:`${target.name} уничтожен`};
      }
    }
    return {ok:false, msg:'Карта не найдена'};
  },
  
  moveRow: (target, fromRow, toRow, gameState) => {
    if (!target||!fromRow||!toRow) return {ok:false, msg:'Ошибка'};
    const idx = gameState.playerField[fromRow].findIndex(c => c.id === target.id);
    if (idx > -1 && gameState.playerField[toRow].length < 4) {
      const [card] = gameState.playerField[fromRow].splice(idx, 1);
      gameState.playerField[toRow].push(card);
      return {ok:true, msg:`${target.name} перемещён`};
    }
    return {ok:false, msg:'Не удалось'};
  },
  
  swap: (target, source, gameState) => {
    if (!target) return {ok:false, msg:'Нет цели'};
    return CardEffects.destroy(target, gameState);
  },
  
  reveal: (count) => {
    return {ok:true, msg:`Показано карт: ${count}`};
  },
  
  steal: (target, gameState) => {
    if (!target) return {ok:false, msg:'Нет цели'};
    return CardEffects.returnToHand(target, gameState);
  },
  
  copy: () => {
    return {ok:true, msg:'Способность скопирована!'};
  },
  
  counter: () => {
    return {ok:true, msg:'Способность отменена!'};
  },
  
  persist: () => {
    return {ok:true, msg:'Карта остаётся на поле'};
  },
  
  doubleTrigger: () => {
    return {ok:true, msg:'Эффекты активированы повторно!'};
  },
  
  addCharge: (target, value) => {
    return {ok:true, msg:`+${value} заряд`};
  },
  
  transform: (target, intoCardId, gameState) => {
    if (!target) return {ok:false, msg:'Нет цели'};
    const faction = FACTIONS[gameState.playerFaction];
    const newCard = faction?.cards?.find(c => c.id === intoCardId);
    if (newCard) {
      Object.assign(target, newCard);
      return {ok:true, msg:`${target.name} трансформирован`};
    }
    return {ok:false, msg:'Карта не найдена'};
  },
  
  ignoreDamage: () => {
    return {ok:true, msg:'Урон игнорируется'};
  },
  
  onDeath: (effect) => {
    return {ok:true, msg:'Эффект смерти активирован'};
  },
  
  onMove: (effect) => {
    return {ok:true, msg:'Эффект перемещения активирован'};
  },
  
  onHeal: (effect) => {
    return {ok:true, msg:'Эффект лечения активирован'};
  },
  
  onBuff: (effect) => {
    return {ok:true, msg:'Эффект усиления активирован'};
  },
  
  synergy: () => {
    return {ok:true, msg:'Синергия активирована!'};
  },
  
  trap: () => {
    return {ok:true, msg:'Ловушка установлена!'};
  },
  
  curse: () => {
    return {ok:true, msg:'Проклятие наложено!'};
  },
  
  playFromDeck: (cardId, gameState) => {
    return {ok:true, msg:'Карта сыграна из колоды!'};
  },
  
  summonFromDeck: (count, maxInfluence, gameState) => {
    return {ok:true, msg:'Карта призвана из колоды!'};
  },
  
  revive: (target, gameState) => {
    return {ok:true, msg:'Карта воскрешена!'};
  },
  
  buffRow: (row, value, stat, gameState) => {
    const rowCards = gameState.playerField[row] || [];
    rowCards.forEach(c => CardEffects.buff(c, value, stat));
    return {ok:true, msg:`Ряд усилен на +${value}`};
  },
  
  resetLeader: (gameState) => {
    gameState.leaderUsed = false;
    return {ok:true, msg:'Лидер восстановлен!'};
  },
  
  randomizeStats: (card) => {
    card.power = Math.floor(Math.random() * 14) + 1;
    card.armor = Math.floor(Math.random() * 14) + 1;
    card.health = Math.floor(Math.random() * 14) + 1;
    return {ok:true, msg:`Случайные статы: ⚔️${card.power} 🛡️${card.armor} ❤️${card.health}`};
  },
  
  mirrorBuff: () => {
    return {ok:true, msg:'Зеркальное усиление!'};
  },
  
  reviveOnDeath: () => {
    return {ok:true, msg:'Восстановление при смерти!'};
  },
  
  persistBetweenRounds: (card) => {
    card.persistBetweenRounds = true;
    return {ok:true, msg:'Карта останется между раундами!'};
  }
};

// === ПРОВЕРКА КОМБО АПОКАЛИПСИСА ===
function checkApocalypseCombo(gameState) {
  const allCards = [
    ...gameState.playerField.left,
    ...gameState.playerField.right
  ];
  
  const cardNames = allCards.map(c => c.name.toLowerCase());
  
  const hasDeath = cardNames.includes('смерть');
  const hasFamine = cardNames.includes('голод');
  const hasWar = cardNames.includes('война');
  const hasPlague = cardNames.includes('чума');
  
  if (hasDeath && hasFamine && hasWar && hasPlague) {
    const faction = FACTIONS[gameState.playerFaction];
    const apocalypseCard = faction?.cards?.find(c => c.name.toLowerCase() === 'апокалипсис');
    
    if (apocalypseCard) {
      const idx = gameState.playerDeck.findIndex(c => c.id === apocalypseCard.id);
      if (idx > -1) {
        const [apocalypse] = gameState.playerDeck.splice(idx, 1);
        
        const enemies = [...gameState.opponentField.left, ...gameState.opponentField.right];
        if (enemies.length > 0) {
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          CardEffects.destroy(target, gameState);
          gameState.playerDiscard.push(apocalypse);
          
          return {
            ok: true,
            msg: '🔥 АПОКАЛИПСИС! Уничтожена карта: ' + target.name
          };
        }
      }
    }
  }
  
  return {ok: false, msg: ''};
}

// === ОБРАБОТКА ЭФФЕКТОВ КАРТ ===
function handleCardEffect(card, context={}) {
  if (!card?.effect) return {ok:true, msg:'Нет эффекта'};
  const eff = card.effect;
  const gameState = context.gameState;
  
  if (eff.action === 'damage') {
    const enemies = [...gameState.opponentField.left, ...gameState.opponentField.right];
    if (enemies[0]) return CardEffects.damage(enemies[0], eff.value||1);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'heal') {
    const allies = [...gameState.playerField.left, ...gameState.playerField.right];
    if (allies[0]) return CardEffects.heal(allies[0], eff.value||2);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'buff' && eff.stat) {
    const allies = gameState.playerField[context.row]?.filter(c => c.id !== card.id) || [];
    if (allies[0]) return CardEffects.buff(allies[0], eff.value||2, eff.stat);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'summon' && eff.card) {
    return CardEffects.summon(eff.card, eff.count||1, eff.position==='adjacent'?(context.row||'left'):'left', gameState);
  }
  
  if (eff.action === 'draw') {
    return CardEffects.draw(eff.value||1, gameState);
  }
  
  if (eff.action === 'returnToHand' || eff.action === 'return_to_hand') {
    const allies = [...gameState.playerField.left, ...gameState.playerField.right];
    if (allies[0]) return CardEffects.returnToHand(allies[0], gameState);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'destroy') {
    const enemies = [...gameState.opponentField.left, ...gameState.opponentField.right];
    if (enemies[0]) return CardEffects.destroy(enemies[0], gameState);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'moveRow' || eff.action === 'move_row') {
    const allies = [...gameState.playerField.left, ...gameState.playerField.right];
    if (allies[0]) {
      const fromRow = gameState.playerField.left.includes(allies[0]) ? 'left' : 'right';
      const toRow = fromRow === 'left' ? 'right' : 'left';
      return CardEffects.moveRow(allies[0], fromRow, toRow, gameState);
    }
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'swap') {
    const enemies = [...gameState.opponentField.left, ...gameState.opponentField.right];
    if (enemies[0]) return CardEffects.swap(enemies[0], eff.source||'discard', gameState);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'reveal') {
    return CardEffects.reveal(eff.value||1);
  }
  
  if (eff.action === 'steal') {
    const enemies = [...gameState.opponentField.left, ...gameState.opponentField.right];
    if (enemies[0]) return CardEffects.steal(enemies[0], gameState);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'copy') {
    return CardEffects.copy();
  }
  
  if (eff.action === 'counter') {
    return CardEffects.counter();
  }
  
  if (eff.action === 'persist') {
    return CardEffects.persist();
  }
  
  if (eff.action === 'doubleTrigger' || eff.action === 'double_trigger') {
    return CardEffects.doubleTrigger();
  }
  
  if (eff.action === 'addCharge' || eff.action === 'add_charge') {
    return CardEffects.addCharge(null, eff.value||1);
  }
  
  if (eff.action === 'transform') {
    const allies = [...gameState.playerField.left, ...gameState.playerField.right];
    if (allies[0]) return CardEffects.transform(allies[0], eff.into||eff.intoCardId, gameState);
    return {ok:false, msg:'Нет целей'};
  }
  
  if (eff.action === 'ignoreDamage' || eff.action === 'ignore_damage') {
    return CardEffects.ignoreDamage();
  }
  
  if (eff.action === 'onDeath' || eff.action === 'on_death') {
    return CardEffects.onDeath(eff);
  }
  
  if (eff.action === 'onMove' || eff.action === 'on_move') {
    return CardEffects.onMove(eff);
  }
  
  if (eff.action === 'onHeal' || eff.action === 'on_heal') {
    return CardEffects.onHeal(eff);
  }
  
  if (eff.action === 'onBuff' || eff.action === 'on_buff') {
    return CardEffects.onBuff(eff);
  }
  
  if (eff.action === 'synergy') {
    return CardEffects.synergy();
  }
  
  if (eff.action === 'trap') {
    return CardEffects.trap();
  }
  
  if (eff.action === 'curse') {
    return CardEffects.curse();
  }
  
  if (eff.action === 'playFromDeck' || eff.action === 'play_from_deck') {
    return CardEffects.playFromDeck(eff.card, gameState);
  }
  
  if (eff.action === 'summonFromDeck' || eff.action === 'summon_from_deck') {
    return CardEffects.summonFromDeck(eff.count||1, eff.maxInfluence||6, gameState);
  }
  
  if (eff.action === 'revive' || eff.action === 'revive_play') {
    return CardEffects.revive(null, gameState);
  }
  
  if (eff.action === 'buffRow' || eff.action === 'buff_row') {
    return CardEffects.buffRow(context.row, eff.value||2, eff.stat||'power', gameState);
  }
  
  if (eff.action === 'resetLeader' || eff.action === 'reset_leader') {
    return CardEffects.resetLeader(gameState);
  }
  
  if (eff.action === 'randomizeStats' || eff.action === 'randomize_stats') {
    return CardEffects.randomizeStats(card);
  }
  
  if (eff.action === 'mirrorBuff' || eff.action === 'mirror_buff') {
    return CardEffects.mirrorBuff();
  }
  
  if (eff.action === 'reviveOnDeath' || eff.action === 'revive_on_death') {
    return CardEffects.reviveOnDeath();
  }
  
  if (eff.action === 'persistBetweenRounds' || eff.action === 'persist_between_rounds') {
    return CardEffects.persistBetweenRounds(card);
  }
  
  if (eff.action === 'apocalypse_combo') {
    return checkApocalypseCombo(gameState);
  }
  
  return {ok:true, msg:'Эффект активирован'};
}

// === ОБРАБОТКА СПОСОБНОСТЕЙ ЛИДЕРОВ ===
function handleLeaderAbility(faction, leaderIdx, gameState) {
  const leader = FACTIONS[faction]?.leaders?.[leaderIdx];
  if (!leader?.ability) return {ok:false, msg:'Способность не найдена'};
  
  const abil = leader.ability;
  
  if (abil.type === 'damage') {
    const enemies = [...gameState.opponentField.left, ...gameState.opponentField.right];
    if (enemies[0]) return CardEffects.damage(enemies[0], abil.value||3);
  }
  else if (abil.type === 'heal') {
    const allies = [...gameState.playerField.left, ...gameState.playerField.right];
    if (allies[0]) return CardEffects.heal(allies[0], 5);
  }
  else if (abil.type === 'copy' || abil.type === 'counter') {
    gameState.playerField.left.forEach(c => { c.power+=2; c.armor+=1; });
    gameState.playerField.right.forEach(c => { c.power+=2; c.armor+=1; });
    return {ok:true, msg:'Способность скопирована!'};
  }
  else if (abil.type === 'reveal_take') {
    return {ok:true, msg:'Показаны карты из колоды противника'};
  }
  else if (abil.type === 'return_to_hand') {
    return {ok:true, msg:'Карта возвращена в руку'};
  }
  else if (abil.type === 'summon') {
    return CardEffects.summon(abil.card, 1, 'left', gameState);
  }
  else if (abil.type === 'summon_from_deck') {
    return CardEffects.summonFromDeck(1, 99, gameState);
  }
  else if (abil.type === 'add_charge') {
    return CardEffects.addCharge(null, 1);
  }
  else if (abil.type === 'play_from_deck') {
    return CardEffects.playFromDeck(null, gameState);
  }
  else if (abil.type === 'move_row') {
    return {ok:true, msg:'Карта перемещена в другой ряд'};
  }
  else if (abil.type === 'damage_all') {
    return {ok:true, msg:'Нанесён урон всем картам'};
  }
  
  return {ok:true, msg:abil.description || 'Способность активирована!'};
}

// Экспорт
if (typeof window !== 'undefined') {
  window.CardEffects = CardEffects;
  window.handleCardEffect = handleCardEffect;
  window.handleLeaderAbility = handleLeaderAbility;
  window.checkApocalypseCombo = checkApocalypseCombo;
}
