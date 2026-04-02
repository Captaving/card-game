// effects.js - Система эффектов карт и лидеров

const EffectTypes = {
  // === БАЗОВЫЕ ЭФФЕКТЫ ===
  
  // Нанести урон карте
  damage: (gameState, params) => {
    const { target, value, source } = params;
    if (!target) return { success: false, message: 'Нет цели' };
    
    target.health = (target.health || 0) - value;
    if (target.health <= 0) {
      return { success: true, message: `${target.name} уничтожен!`, destroyed: target };
    }
    return { success: true, message: `${target.name} получил ${value} урона` };
  },
  
  // Исцелить карту
  heal: (gameState, params) => {
    const { target, value } = params;
    if (!target) return { success: false, message: 'Нет цели' };
    
    const maxHealth = target.maxHealth || target.health;
    target.health = Math.min(maxHealth, (target.health || 0) + value);
    return { success: true, message: `${target.name} исцелён на ${value}` };
  },
  
  // Усилить карту
  buff: (gameState, params) => {
    const { target, value, stat } = params;
    if (!target || !stat) return { success: false, message: 'Нет цели или параметра' };
    
    target[stat] = (target[stat] || 0) + value;
    return { success: true, message: `${target.name}: +${value} к ${stat}` };
  },
  
  // Призвать карту из колоды
  summon: (gameState, params) => {
    const { cardId, count = 1, row } = params;
    const faction = FACTIONS[gameState.playerFaction];
    const cardTemplate = faction?.cards?.find(c => c.id === cardId);
    
    if (!cardTemplate) return { success: false, message: 'Карта не найдена' };
    
    const summoned = [];
    for (let i = 0; i < count; i++) {
      const newCard = { ...cardTemplate, instanceId: Date.now() + i };
      if (row && gameState.playerField[row].length < 4) {
        gameState.playerField[row].push(newCard);
        summoned.push(newCard);
      }
    }
    return { success: true, message: `Призвано ${summoned.length} карт`, summoned };
  },
  
  // Вернуть карту в руку
  returnToHand: (gameState, params) => {
    const { target, fromField } = params;
    if (!target) return { success: false, message: 'Нет цели' };
    
    // Удалить с поля
    ['left', 'right'].forEach(row => {
      const idx = gameState.playerField[row].findIndex(c => c.id === target.id);
      if (idx > -1) {
        gameState.playerField[row].splice(idx, 1);
        gameState.playerHand.push(target);
        return { success: true, message: `${target.name} возвращён в руку` };
      }
    });
    return { success: false, message: 'Карта не найдена на поле' };
  },
  
  // Переместить карту в другой ряд
  moveRow: (gameState, params) => {
    const { target, fromRow, toRow } = params;
    if (!target || !fromRow || !toRow) return { success: false, message: 'Нет параметров' };
    
    const idx = gameState.playerField[fromRow].findIndex(c => c.id === target.id);
    if (idx > -1 && gameState.playerField[toRow].length < 4) {
      const [card] = gameState.playerField[fromRow].splice(idx, 1);
      gameState.playerField[toRow].push(card);
      return { success: true, message: `${target.name} перемещён` };
    }
    return { success: false, message: 'Не удалось переместить' };
  },
  
  // === ЭФФЕКТЫ ЛИДЕРОВ ===
  
  // Урон лидером
  leaderDamage: (gameState, params) => {
    return EffectTypes.damage(gameState, params);
  },
  
  // Исцеление лидером
  leaderHeal: (gameState, params) => {
    return EffectTypes.heal(gameState, params);
  },
  
  // Копирование способности
  leaderCopy: (gameState, params) => {
    // Упрощённо: даём +2 ко всем статистикам
    gameState.playerField.left.forEach(c => { c.power += 2; c.armor += 1; });
    gameState.playerField.right.forEach(c => { c.power += 2; c.armor += 1; });
    return { success: true, message: 'Способность скопирована!' };
  }
};

// === ОБРАБОТЧИК ЭФФЕКТОВ КАРТ ===
function processCardEffect(gameState, card, context = {}) {
  if (!card?.effect) return { success: true, message: 'Нет эффекта' };
  
  const effect = card.effect;
  const handler = EffectTypes[effect.action];
  
  if (!handler) {
    console.warn('Нет обработчика для эффекта:', effect.action);
    return { success: false, message: 'Эффект не реализован' };
  }
  
  // Подготовка параметров
  const params = {
    ...effect,
    source: card,
    gameState,
    ...context
  };
  
  return handler(gameState, params);
}

// === ОБРАБОТЧИК СПОСОБНОСТЕЙ ЛИДЕРОВ ===
function processLeaderAbility(gameState, faction, abilityName, context = {}) {
  const factionData = FACTIONS[faction];
  const leader = factionData?.leaders?.find(l => l.id.includes(abilityName) || l.name.includes(abilityName));
  
  if (!leader?.ability) {
    return { success: false, message: 'Способность не найдена' };
  }
  
  const ability = leader.ability;
  const handler = EffectTypes[ability.type] || EffectTypes[ability.action];
  
  if (!handler) {
    return { success: false, message: 'Способность не реализована' };
  }
  
  return handler(gameState, { ...ability, ...context, gameState });
}

// === ВЫБОР ЦЕЛИ ДЛЯ ЭФФЕКТА (упрощённый) ===
function selectTarget(gameState, targetType, callback) {
  const targets = [];
  
  if (targetType === 'own_unit') {
    targets.push(...gameState.playerField.left, ...gameState.playerField.right);
  } else if (targetType === 'enemy_unit') {
    targets.push(...gameState.opponentField.left, ...gameState.opponentField.right);
  } else if (targetType === 'any_unit') {
    targets.push(
      ...gameState.playerField.left, ...gameState.playerField.right,
      ...gameState.opponentField.left, ...gameState.opponentField.right
    );
  }
  
  if (targets.length === 0) {
    callback(null);
    return;
  }
  
  // Для прототипа: берём первую подходящую карту
  callback(targets[0]);
}

// Экспорт
if (typeof window !== 'undefined') {
  window.EffectTypes = EffectTypes;
  window.processCardEffect = processCardEffect;
  window.processLeaderAbility = processLeaderAbility;
  window.selectTarget = selectTarget;
}