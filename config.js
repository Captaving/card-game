// config.js - База данных всех карт и лидеров
// Версия: 1.0

// === ГЛОБАЛЬНЫЕ НАСТРОЙКИ ИГРЫ ===
const GAME_CONFIG = {
  maxDeckSize: 25,           // Карт в колоде
  maxInfluence: 150,         // Лимит влияния
  rows: ['left', 'right'],   // Линии на поле
  maxCardsPerRow: 4,         // Лимит карт в ряду
  rounds: 3,                 // Раундов в матче
  startHandSize: 10,         // Карт в руке в начале
  cardsPerRound: 2,          // Карт добавляется после раунда
  maxCopiesDefault: 3        // Макс. копий карты по умолчанию
};

// === ЦВЕТОВАЯ СХЕМА ===
const COLORS = {
  factions: {
    knights: '#3498db',    // Синий
    mages: '#926eae',      // Сиреневый
    cultists: '#2c3e50',   // Черный
    dryads: '#2ecc71'      // Салатовый
  },
  types: {
    white: '#ffffff',
    gray: '#95a5a6',
    purple: '#a233ff',
    gold: '#f1c40f',
    special: '#e74c3c'
  }
};

// === ФРАКЦИИ И КАРТЫ ===
const FACTIONS = {};

// -------------------------------------------
// ФРАКЦИЯ 1: РЫЦАРИ ЦВЕТКА ЛИЛИИ (Синий)
// -------------------------------------------
FACTIONS.knights = {
  id: 'knights',
  name: 'Рыцари Цветка Лилии',
  color: '#3498db',
  cards: [
    // === БЕЛЫЕ КАРТЫ ===
    {
      id: 'knights_white_01',
      name: 'Пехотинец',
      type: 'white',
      row: 'left',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'knights_white_02',
      name: 'Пехотинец',
      type: 'white',
      row: 'left',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'knights_white_03',
      name: 'Пехотинец',
      type: 'white',
      row: 'left',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 3,
      effect: null
    },
    
    // === СЕРЫЕ КАРТЫ ===
    {
      id: 'knights_gray_04',
      name: 'Рыцарь Ордена',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 4,
      health: 4,
      influence: 4,
      maxInDeck: 2,
      effect: null
    },
    {
      id: 'knights_gray_05',
      name: 'Рыцарь Ордена',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 2,
      health: 4,
      influence: 4,
      maxInDeck: 2,
      effect: null
    },
    {
      id: 'knights_gray_06',
      name: 'Знаменосец',
      type: 'gray',
      row: 'left',
      power: 3,
      armor: 2,
      health: 6,
      influence: 4,
      maxInDeck: 2,
      effect: null
    },
    {
      id: 'knights_gray_07',
      name: 'Знаменосец',
      type: 'gray',
      row: 'left',
      power: 3,
      armor: 2,
      health: 6,
      influence: 4,
      maxInDeck: 2,
      effect: null
    },
    {
      id: 'knights_gray_10',
      name: 'Требушет',
      type: 'gray',
      row: 'right',
      power: 3,
      armor: 3,
      health: 3,
      influence: 4,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'knights_gray_11',
      name: 'Требушет',
      type: 'gray',
      row: 'right',
      power: 3,
      armor: 3,
      health: 3,
      influence: 4,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'knights_gray_12',
      name: 'Требушет',
      type: 'gray',
      row: 'right',
      power: 3,
      armor: 3,
      health: 3,
      influence: 4,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'knights_gray_13',
      name: 'Арбалетчик',
      type: 'gray',
      row: 'right',
      power: 4,
      armor: 1,
      health: 3,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении наносят 1 урон любой карте противника'
      }
    },
    {
      id: 'knights_gray_14',
      name: 'Арбалетчик',
      type: 'gray',
      row: 'right',
      power: 4,
      armor: 1,
      health: 3,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении наносят 1 урон любой карте противника'
      }
    },
    {
      id: 'knights_gray_15',
      name: 'Арбалетчик',
      type: 'gray',
      row: 'right',
      power: 4,
      armor: 1,
      health: 3,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении наносят 1 урон любой карте противника'
      }
    },
    
    // === ФИОЛЕТОВЫЕ КАРТЫ ===
    {
      id: 'knights_purple_08',
      name: 'Воин Света',
      type: 'purple',
      row: 'left',
      power: 1,
      armor: 1,
      health: 6,
      influence: 5,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'buff',
        value: 2,
        stat: 'power',
        target: 'own_unit',
        description: 'При размещении выберите свою карту, она получит +2 к Силе'
      }
    },
    {
      id: 'knights_purple_09',
      name: 'Воин Света',
      type: 'purple',
      row: 'left',
      power: 1,
      armor: 1,
      health: 6,
      influence: 5,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'buff',
        value: 2,
        stat: 'power',
        target: 'own_unit',
        description: 'При размещении выберите свою карту, она получит +2 к Силе'
      }
    },
    {
      id: 'knights_purple_16',
      name: 'Разведчик',
      type: 'purple',
      row: 'right',
      power: 1,
      armor: 0,
      health: 1,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'reveal',
        value: 1,
        target: 'enemy_hand',
        description: 'При размещении показывает 1 карту в руке противника'
      }
    },
    {
      id: 'knights_purple_17',
      name: 'Разведчик',
      type: 'purple',
      row: 'right',
      power: 1,
      armor: 0,
      health: 1,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'reveal',
        value: 1,
        target: 'enemy_hand',
        description: 'При размещении показывает 1 карту в руке противника'
      }
    },
    {
      id: 'knights_purple_18',
      name: 'Братья Стали',
      type: 'purple',
      row: 'right',
      power: 4,
      armor: 2,
      health: 3,
      influence: 4,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'synergy',
        value: 2,
        stat: 'power',
        condition: 'adjacent_same_name',
        description: 'При размещении рядом с картой Братья Стали увеличивает силу этих двух карт на +2'
      }
    },
    {
      id: 'knights_purple_19',
      name: 'Братья Стали',
      type: 'purple',
      row: 'right',
      power: 4,
      armor: 2,
      health: 3,
      influence: 4,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'synergy',
        value: 2,
        stat: 'power',
        condition: 'adjacent_same_name',
        description: 'При размещении рядом с картой Братья Стали увеличивает силу этих двух карт на +2'
      }
    },
    {
      id: 'knights_purple_20',
      name: 'Падший рыцарь',
      type: 'purple',
      row: 'any',
      power: 2,
      armor: 0,
      health: 0,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'steal',
        target: 'enemy_field',
        destination: 'own_hand',
        description: 'При размещении заберите с поля любую карту противника в свою руку'
      }
    },
    {
      id: 'knights_purple_21',
      name: 'Опытный лучник',
      type: 'purple',
      row: 'right',
      power: 5,
      armor: 1,
      health: 3,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit_selectable',
        description: 'При размещении выберите карту противника и нанесите ей 1 урон'
      }
    },
    {
      id: 'knights_purple_22',
      name: 'Опытный лучник',
      type: 'purple',
      row: 'right',
      power: 5,
      armor: 1,
      health: 3,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit_selectable',
        description: 'При размещении выберите карту противника и нанесите ей 1 урон'
      }
    },
    {
      id: 'knights_purple_23',
      name: 'Рыцарь Эливан',
      type: 'purple',
      row: 'any',
      power: 7,
      armor: 3,
      health: 4,
      influence: 8,
      maxInDeck: 1,
      effect: null
    },
    {
      id: 'knights_purple_24',
      name: 'Сир Грегори Траттен',
      type: 'purple',
      row: 'left',
      power: 2,
      armor: 7,
      health: 5,
      influence: 8,
      maxInDeck: 1,
      effect: null
    },
    {
      id: 'knights_purple_25',
      name: 'Карлос Аугуст',
      type: 'purple',
      row: 'any',
      power: 10,
      armor: 5,
      health: 4,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'active',
        action: 'damage',
        usage: 'once_per_game',
        description: 'Может нанести урон равный его силе любой карте противника 1 раз за игру'
      }
    },
    // === ЗОЛОТЫЕ КАРТЫ ===
    {
      id: 'knights_gold_36',
      name: 'Стена щитов',
      type: 'gold',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'buff_row',
        value: 4,
        stat: 'armor',
        description: 'При размещении дает всем картам в ряду +4 к броне'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_gold_37',
      name: 'Лекарь Салема',
      type: 'gold',
      row: 'any',
      power: 5,
      armor: 0,
      health: 5,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'revive',
        target: 'own_discard',
        description: 'При размещении возвращает на поле 1 карту из отбоя'
      }
    },
    {
      id: 'knights_gold_38',
      name: 'Архиепископ Сентор',
      type: 'gold',
      row: 'any',
      power: 1,
      armor: 0,
      health: 5,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'combo',
        comboCard: 'knights_special_39',
        description: 'Один раз за игру может применить карту "Покаяние господня" если она есть в колоде'
      }
    },
    {
      id: 'knights_gold_40',
      name: 'Отто Фон Гаус',
      type: 'gold',
      row: 'any',
      power: 15,
      armor: 5,
      health: 10,
      influence: 12,
      maxInDeck: 1,
      effect: null
    },
    {
      id: 'knights_gold_42',
      name: 'Рыцарь Маркус Таристан',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 5,
      health: 6,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 8,
        target: 'enemy_unit_selectable',
        description: 'При размещении нанесите 8 урона любой на выбор карте противника на поле'
      }
    },
    {
      id: 'knights_gold_43',
      name: 'Королевский Шпион',
      type: 'gold',
      row: 'enemy_any',
      power: 5,
      armor: 3,
      health: 5,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'steal_top',
        target: 'enemy_deck',
        action2: 'play_immediately',
        description: 'При размещении возьмите верхнюю карту из колоды противника и сыграйте ее'
      },
      placeOnEnemy: true
    },
    {
      id: 'knights_gold_44',
      name: 'Анна Штраус',
      type: 'gold',
      row: 'any',
      power: 3,
      armor: 3,
      health: 5,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'buff',
        value: 7,
        stat: 'health',
        target: 'own_unit_selectable',
        description: 'При размещении выберите карту со своего поля и дайте ей +7 к здоровью'
      }
    },
    {
      id: 'knights_gold_45',
      name: 'Король Аугуст Роззен',
      type: 'gold',
      row: 'any',
      power: 6,
      armor: 6,
      health: 8,
      influence: 20,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'double_trigger',
        description: 'При размещении в ряду, карты у которых есть эффект размещения повторно активируют свои умения'
      }
    },
    
    // === ОСОБЫЕ КАРТЫ ===
    {
      id: 'knights_special_26',
      name: 'Яма с кольями',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'trap',
        trigger: 'enemy_buff',
        value: 3,
        description: 'При размещении выберите карту противника, если она получит увеличение силы, нанесите ей 3 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_27',
      name: 'Яма с кольями',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'trap',
        trigger: 'enemy_buff',
        value: 3,
        description: 'При размещении выберите карту противника, если она получит увеличение силы, нанесите ей 3 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_28',
      name: 'Яма с кольями',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'trap',
        trigger: 'enemy_buff',
        value: 3,
        description: 'При размещении выберите карту противника, если она получит увеличение силы, нанесите ей 3 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_29',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_30',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_31',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_32',
      name: 'Бомба',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 4,
        target: 'enemy_leader',
        description: 'При размещении нанесите противнику 4 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_33',
      name: 'Бомба',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 4,
        target: 'enemy_leader',
        description: 'При размещении нанесите противнику 4 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_34',
      name: 'Бомба',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 4,
        target: 'enemy_leader',
        description: 'При размещении нанесите противнику 4 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_35',
      name: 'Бомба',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 4,
        target: 'enemy_leader',
        description: 'При размещении нанесите противнику 4 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_39',
      name: 'Покаяние Господня',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'combo_trigger',
        comboCard: 'knights_gold_38',
        buff: { power: 10, armor: 3 },
        description: 'При использовании данной карты, карта Архиепископ Сентор получает 10 силы и 3 брони'
      },
      discardAfterUse: true
    },
    {
      id: 'knights_special_41',
      name: 'Королевский рог',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'buff_all',
        value: 2,
        stat: 'power',
        description: 'Дает всем картам на поле +2 к Силе'
      },
      discardAfterUse: true
    }
  ], // конец массива cards
  
  // === ЛИДЕРЫ ФРАКЦИИ ===
  leaders: [
    {
      id: 'knights_leader_01',
      name: 'Король Аугуст Роззен Смелый',
      ability: {
        type: 'damage',
        value: 3,
        target: 'enemy_unit',
        description: 'Нанесите 3 урона карте'
      },
      usage: 'once_per_game'
    },
    {
      id: 'knights_leader_02',
      name: 'Король Аугуст Роззен Отважный',
      ability: {
        type: 'counter',
        target: 'enemy_leader',
        description: 'Отменяет умение лидера фракции противника'
      },
      usage: 'once_per_game'
    },
    {
      id: 'knights_leader_03',
      name: 'Король Аугуст Роззен Победитель',
      ability: {
        type: 'heal',
        target: 'own_unit',
        value: 'full',
        description: 'Восстановите здоровье своей карты'
      },
      usage: 'once_per_game'
    }
  ]
}; // конец FACTIONS.knights
// -------------------------------------------
// ФРАКЦИЯ 2: ОРДЕН ЧАРОДЕЕВ (Сиреневый)
// -------------------------------------------
FACTIONS.mages = {
  id: 'mages',
  name: 'Орден Чародеев',
  color: '#926eae',
  cards: [
    // === БЕЛЫЕ КАРТЫ ===
    {
      id: 'mages_white_01',
      name: 'Адепт Ордена Чародеев',
      type: 'white',
      row: 'left',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'mages_white_02',
      name: 'Адепт Ордена Чародеев',
      type: 'white',
      row: 'left',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'mages_white_03',
      name: 'Адепт Ордена Чародеев',
      type: 'white',
      row: 'left',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 3,
      effect: null
    },
    
    // === СЕРЫЕ КАРТЫ ===
    {
      id: 'mages_gray_04',
      name: 'Адепт Школы Огня',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 4,
      health: 4,
      influence: 4,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении нанесите 1 урон любой карте противника'
      }
    },
    {
      id: 'mages_gray_05',
      name: 'Адепт Школы Огня',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 2,
      health: 4,
      influence: 4,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении нанесите 1 урон любой карте противника'
      }
    },
    {
      id: 'mages_gray_06',
      name: 'Адепт Школы Восстановления',
      type: 'gray',
      row: 'left',
      power: 3,
      armor: 2,
      health: 6,
      influence: 4,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'heal',
        value: 1,
        target: 'own_unit',
        description: 'При размещении дает +1 здоровья любой вашей карте на поле'
      }
    },
    {
      id: 'mages_gray_07',
      name: 'Адепт Школы Восстановления',
      type: 'gray',
      row: 'left',
      power: 3,
      armor: 2,
      health: 6,
      influence: 4,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'heal',
        value: 1,
        target: 'own_unit',
        description: 'При размещении дает +1 здоровья любой вашей карте на поле'
      }
    },
    {
      id: 'mages_gray_08',
      name: 'Чародеи Силы Света',
      type: 'gray',
      row: 'left',
      power: 4,
      armor: 1,
      health: 2,
      influence: 5,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'play_from_deck',
        card: 'mages_special_10',
        description: 'При размещении сыграйте карту Элексир жизни из колоды'
      }
    },
    {
      id: 'mages_gray_09',
      name: 'Чародеи Силы Света',
      type: 'gray',
      row: 'left',
      power: 1,
      armor: 1,
      health: 6,
      influence: 5,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'play_from_deck',
        card: 'mages_special_10',
        description: 'При размещении сыграйте карту Элексир жизни из колоды'
      }
    },
    
    // === ФИОЛЕТОВЫЕ КАРТЫ ===
    {
      id: 'mages_purple_13',
      name: 'Советник Короля',
      type: 'purple',
      row: 'enemy_any',
      power: 3,
      armor: 3,
      health: 3,
      influence: 6,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'steal_field',
        target: 'enemy_unit',
        description: 'При размещении заберите карту с поля противника на свое поле'
      },
      placeOnEnemy: true
    },
    {
      id: 'mages_purple_14',
      name: 'Советник Короля',
      type: 'purple',
      row: 'enemy_any',
      power: 3,
      armor: 3,
      health: 3,
      influence: 6,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'steal_field',
        target: 'enemy_unit',
        description: 'При размещении заберите карту с поля противника на свое поле'
      },
      placeOnEnemy: true
    },
    {
      id: 'mages_purple_15',
      name: 'Советник Короля',
      type: 'purple',
      row: 'enemy_any',
      power: 3,
      armor: 3,
      health: 3,
      influence: 6,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'steal_field',
        target: 'enemy_unit',
        description: 'При размещении заберите карту с поля противника на свое поле'
      },
      placeOnEnemy: true
    },
    {
      id: 'mages_purple_16',
      name: 'Магистр Ордена',
      type: 'purple',
      row: 'right',
      power: 6,
      armor: 0,
      health: 4,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'passive',
        trigger: 'own_heal',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'Если этой карте увеличивают здоровье, наносит 1 урон любой карте противника'
      }
    },
    {
      id: 'mages_purple_17',
      name: 'Магистр Ордена',
      type: 'purple',
      row: 'right',
      power: 6,
      armor: 0,
      health: 4,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'passive',
        trigger: 'own_heal',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'Если этой карте увеличивают здоровье, наносит 1 урон любой карте противника'
      }
    },
    {
      id: 'mages_purple_18',
      name: 'Магистр Темных Искусств',
      type: 'purple',
      row: 'right',
      power: 4,
      armor: 0,
      health: 2,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'swap',
        target: 'enemy_field',
        source: 'enemy_discard',
        description: 'При размещении замените карту противника на поле любой картой из его сброса'
      }
    },
    {
      id: 'mages_purple_19',
      name: 'Магистр Темных Искусств',
      type: 'purple',
      row: 'right',
      power: 4,
      armor: 0,
      health: 2,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'swap',
        target: 'enemy_field',
        source: 'enemy_discard',
        description: 'При размещении замените карту противника на поле любой картой из его сброса'
      }
    },
    {
      id: 'mages_purple_20',
      name: 'Некромант',
      type: 'purple',
      row: 'any',
      power: 2,
      armor: 0,
      health: 0,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'revive_play',
        target: 'own_discard',
        count: 1,
        description: 'При размещении возьмите 1 карту из отбоя, и сразу разыграйте ее'
      }
    },
    {
      id: 'mages_purple_21',
      name: 'Мастер Шпионажа',
      type: 'purple',
      row: 'enemy_any',
      power: 6,
      armor: 2,
      health: 2,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'reveal',
        target: 'enemy_hand',
        value: 3,
        description: 'При размещении на поле противника посмотрите 3 его карты из руки'
      },
      placeOnEnemy: true
    },
    {
      id: 'mages_purple_22',
      name: 'Мастер Шпионажа',
      type: 'purple',
      row: 'enemy_any',
      power: 6,
      armor: 2,
      health: 2,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'reveal',
        target: 'enemy_hand',
        value: 3,
        description: 'При размещении на поле противника посмотрите 3 его карты из руки'
      },
      placeOnEnemy: true
    },
    {
      id: 'mages_purple_23',
      name: 'Магистр Ларгусс',
      type: 'purple',
      row: 'any',
      power: 10,
      armor: 2,
      health: 4,
      influence: 8,
      maxInDeck: 1,
      effect: null
    },
    {
      id: 'mages_purple_24',
      name: 'Арториус Вандевер',
      type: 'purple',
      row: 'left',
      power: 8,
      armor: 1,
      health: 5,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'replay',
        target: 'own_field',
        description: 'При размещении выберите карту на своем поле и разыграйте ее размещение еще раз'
      }
    },
    
    // === ОСОБЫЕ КАРТЫ ===
    {
      id: 'mages_special_10',
      name: 'Элексир Жизни',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 6,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'heal',
        value: 3,
        target: 'own_unit_selectable',
        description: 'При размещении дает +3 к жизни выбранной карте'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_11',
      name: 'Элексир Жизни',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 6,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'heal',
        value: 3,
        target: 'own_unit_selectable',
        description: 'При размещении дает +3 к жизни выбранной карте'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_12',
      name: 'Элексир Жизни',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 6,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'heal',
        value: 3,
        target: 'own_unit_selectable',
        description: 'При размещении дает +3 к жизни выбранной карте'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_25',
      name: 'Порошок Ангилеи',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'buff',
        value: 4,
        stat: 'power',
        target: 'own_field_selectable',
        count: 3,
        description: 'При размещении выберете 3 карты на своем поле и увеличьте их силу на +4'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_26',
      name: 'Магическая картечь',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 4,
        target: 'any_unit',
        description: 'Нанесите 4 урона карте'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_27',
      name: 'Магическая картечь',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 4,
        target: 'any_unit',
        description: 'Нанесите 4 урона карте'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_28',
      name: 'Магическая картечь',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 4,
        target: 'any_unit',
        description: 'Нанесите 4 урона карте'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_29',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_30',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_31',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_32',
      name: 'Портал',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'summon_from_deck',
        count: 2,
        maxInfluence: 6,
        description: 'При размещении из колоды выйдет на поле любые 2 карты влияние которых до 6'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_33',
      name: 'Пространственный Порошок',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'move_row',
        target: 'enemy_field',
        description: 'При размещении передвиньте карту в любом ряду противника в другой'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_34',
      name: 'Пространственный Порошок',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'move_row',
        target: 'enemy_field',
        description: 'При размещении передвиньте карту в любом ряду противника в другой'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_35',
      name: 'Пространственный Порошок',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'move_row',
        target: 'enemy_field',
        description: 'При размещении передвиньте карту в любом ряду противника в другой'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_36',
      name: 'Пространственный Порошок',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'move_row',
        target: 'enemy_field',
        description: 'При размещении передвиньте карту в любом ряду противника в другой'
      },
      discardAfterUse: true
    },
    {
      id: 'mages_special_41',
      name: 'Инквизиция',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'destroy',
        target: 'any_unit_selectable',
        comboCard: 'mages_special_42',
        description: 'При размещении уничтожает любую карту на выбор. Если это ваша карта то сыграйте карту Индульгенция'
      },
      discardAfterUse: true,
      isGold: true
    },
    {
      id: 'mages_special_42',
      name: 'Индульгенция',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'revive_buff',
        target: 'own_discard',
        buff: { power: 6 },
        description: 'При размещении выберите карту из отбоя, верните ее на поле и дайте ей +6 к силе'
      },
      discardAfterUse: true,
      isGold: true
    },
    
    // === ЗОЛОТЫЕ КАРТЫ ===
    {
      id: 'mages_gold_37',
      name: 'Шайа Ванбюрен',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 0,
      health: 5,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_discard',
        description: 'При размещении верните из отбоя в руку одну карту'
      }
    },
    {
      id: 'mages_gold_38',
      name: 'Альмерия Франкен',
      type: 'gold',
      row: 'any',
      power: 4,
      armor: 0,
      health: 6,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'passive_hand',
        trigger: 'enemy_turn_end',
        action: 'buff',
        value: 1,
        stat: 'power',
        description: 'Пока эта карта находится в руке, после каждого хода противника она увеличивает силу на +1'
      }
    },
    {
      id: 'mages_gold_39',
      name: 'Гюсто',
      type: 'gold',
      row: 'any',
      power: 10,
      armor: 0,
      health: 10,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'passive_auto_play',
        trigger: 'round_3_start',
        source: ['deck', 'hand'],
        description: 'Если вы не сыграли эту карту, то она в начале 3 раунда выйдет на поле из колоды или руки автоматически'
      }
    },
    {
      id: 'mages_gold_40',
      name: 'Кот в мешке',
      type: 'gold',
      row: 'any',
      power: 'random_1_14',
      armor: 'random_1_14',
      health: 'random_1_14',
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'randomize_stats',
        description: 'При размещении Сила, броня и Здоровье будут выбраны случайным образом'
      }
    },
    {
      id: 'mages_gold_43',
      name: 'Чародей Алексиос',
      type: 'gold',
      row: 'enemy_any',
      power: 5,
      armor: 1,
      health: 5,
      influence: 15,
      maxInDeck: 1,
      effect: {
        type: 'passive_mirror',
        trigger: 'enemy_buff',
        description: 'Когда противник усиливает свою карту Чародей Алексиос тоже усиливается на данное число'
      },
      placeOnEnemy: true
    },
    {
      id: 'mages_gold_44',
      name: 'Чародей Кристофф',
      type: 'gold',
      row: 'any',
      power: 10,
      armor: 5,
      health: 12,
      influence: 15,
      maxInDeck: 1,
      effect: {
        type: 'passive_revive',
        trigger: 'health_depleted',
        value: 3,
        description: 'Если у чародея Кристоффа закончилось здоровье он восполняет еще 3 единицы'
      }
    },
    {
      id: 'mages_gold_45',
      name: 'Чародей Магнуссен',
      type: 'gold',
      row: 'any',
      power: 5,
      armor: 1,
      health: 3,
      influence: 20,
      maxInDeck: 1,
      effect: {
        type: 'passive_persist',
        description: 'Эта карта остается на поле до окончания игры. В конце раунда не уходит в отбой'
      },
      persistBetweenRounds: true
    }
  ], // конец массива cards
  
  // === ЛИДЕРЫ ФРАКЦИИ ===
  leaders: [
    {
      id: 'mages_leader_01',
      name: 'Чародей Магнуссен',
      ability: {
        type: 'copy',
        target: 'enemy_leader',
        description: 'Копирует умение лидера противника'
      },
      usage: 'once_per_game'
    },
    {
      id: 'mages_leader_02',
      name: 'Чародей Кристофф',
      ability: {
        type: 'reveal_take',
        target: 'enemy_deck',
        value: 3,
        description: 'Посмотрите 3 верхние карты колоды противника и возьмите одну себе в руку'
      },
      usage: 'once_per_game'
    },
    {
      id: 'mages_leader_03',
      name: 'Чародей Алексиос',
      ability: {
        type: 'return_to_hand',
        target: 'own_discard',
        description: 'Верните 1 карту из отбоя в руку'
      },
      usage: 'once_per_game'
    }
  ]
}; // конец FACTIONS.mages
// -------------------------------------------
// ФРАКЦИЯ 3: ПРИСЛУЖНИКИ ЧЕРНОЙ ЛИЛИИ (Черный)
// -------------------------------------------
FACTIONS.cultists = {
  id: 'cultists',
  name: 'Прислужники Черной Лилии',
  color: '#2c3e50',
  cards: [
    // === БЕЛЫЕ КАРТЫ ===
    {
      id: 'cultists_white_01',
      name: 'Демон',
      type: 'white',
      row: 'right',
      power: 4,
      armor: 2,
      health: 4,
      influence: 4,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'cultists_white_02',
      name: 'Демон',
      type: 'white',
      row: 'right',
      power: 4,
      armor: 2,
      health: 4,
      influence: 4,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'cultists_white_03',
      name: 'Демон',
      type: 'white',
      row: 'right',
      power: 4,
      armor: 2,
      health: 4,
      influence: 4,
      maxInDeck: 3,
      effect: null
    },
    {
      id: 'cultists_white_13',
      name: 'Падальщик',
      type: 'white',
      row: 'right',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath',
        action: 'buff',
        value: 1,
        stat: 'power',
        target: 'any_unit',
        description: 'При уничтожении дает +1 силу любому отряду на поле'
      }
    },
    {
      id: 'cultists_white_14',
      name: 'Падальщик',
      type: 'white',
      row: 'right',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath',
        action: 'buff',
        value: 1,
        stat: 'power',
        target: 'any_unit',
        description: 'При уничтожении дает +1 силу любому отряду на поле'
      }
    },
    {
      id: 'cultists_white_15',
      name: 'Падальщик',
      type: 'white',
      row: 'right',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath',
        action: 'buff',
        value: 1,
        stat: 'power',
        target: 'any_unit',
        description: 'При уничтожении дает +1 силу любому отряду на поле'
      }
    },
    {
      id: 'cultists_white_16',
      name: 'Падальщик',
      type: 'white',
      row: 'right',
      power: 2,
      armor: 1,
      health: 2,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath',
        action: 'buff',
        value: 1,
        stat: 'power',
        target: 'any_unit',
        description: 'При уничтожении дает +1 силу любому отряду на поле'
      }
    },
    {
      id: 'cultists_white_21',
      name: 'Призрак',
      type: 'white',
      row: 'any',
      power: 1,
      armor: 1,
      health: 1,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath_any',
        action: 'spawn_enemy',
        description: 'После уничтожения карты, призрак появляется в любом ряду противника'
      }
    },
    {
      id: 'cultists_white_22',
      name: 'Призрак',
      type: 'white',
      row: 'any',
      power: 1,
      armor: 1,
      health: 1,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath_any',
        action: 'spawn_enemy',
        description: 'После уничтожения карты, призрак появляется в любом ряду противника'
      }
    },
    {
      id: 'cultists_white_23',
      name: 'Призрак',
      type: 'white',
      row: 'any',
      power: 1,
      armor: 1,
      health: 1,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath_any',
        action: 'spawn_enemy',
        description: 'После уничтожения карты, призрак появляется в любом ряду противника'
      }
    },
    {
      id: 'cultists_white_24',
      name: 'Призрак',
      type: 'white',
      row: 'any',
      power: 1,
      armor: 1,
      health: 1,
      influence: 2,
      maxInDeck: 4,
      effect: {
        type: 'onDeath_any',
        action: 'spawn_enemy',
        description: 'После уничтожения карты, призрак появляется в любом ряду противника'
      }
    },
    
    // === СЕРЫЕ КАРТЫ ===
    {
      id: 'cultists_gray_04',
      name: 'Проклятый',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 1,
      health: 3,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'synergy_row',
        condition: 'same_name_in_row',
        action: 'buff',
        value: 2,
        stat: 'power',
        description: 'При размещении в одном ряду с Проклятыми каждый получает +2 к силе'
      }
    },
    {
      id: 'cultists_gray_05',
      name: 'Проклятый',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 1,
      health: 3,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'synergy_row',
        condition: 'same_name_in_row',
        action: 'buff',
        value: 2,
        stat: 'power',
        description: 'При размещении в одном ряду с Проклятыми каждый получает +2 к силе'
      }
    },
    {
      id: 'cultists_gray_06',
      name: 'Проклятый',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 1,
      health: 3,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'synergy_row',
        condition: 'same_name_in_row',
        action: 'buff',
        value: 2,
        stat: 'power',
        description: 'При размещении в одном ряду с Проклятыми каждый получает +2 к силе'
      }
    },
    {
      id: 'cultists_gray_07',
      name: 'Проклятый',
      type: 'gray',
      row: 'left',
      power: 5,
      armor: 1,
      health: 3,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'synergy_row',
        condition: 'same_name_in_row',
        action: 'buff',
        value: 2,
        stat: 'power',
        description: 'При размещении в одном ряду с Проклятыми каждый получает +2 к силе'
      }
    },
    {
      id: 'cultists_gray_08',
      name: 'Голем',
      type: 'gray',
      row: 'right',
      power: 10,
      armor: 5,
      health: 5,
      influence: 6,
      maxInDeck: 2,
      effect: null
    },
    {
      id: 'cultists_gray_09',
      name: 'Голем',
      type: 'gray',
      row: 'right',
      power: 10,
      armor: 5,
      health: 5,
      influence: 6,
      maxInDeck: 2,
      effect: null
    },
    {
      id: 'cultists_gray_19',
      name: 'Культист',
      type: 'gray',
      row: 'right',
      power: 5,
      armor: 1,
      health: 2,
      influence: 5,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'summon',
        card: 'cultists_white_21',
        description: 'При размещении призовите Призрака'
      }
    },
    {
      id: 'cultists_gray_20',
      name: 'Культист',
      type: 'gray',
      row: 'right',
      power: 5,
      armor: 1,
      health: 2,
      influence: 5,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'summon',
        card: 'cultists_white_21',
        description: 'При размещении призовите Призрака'
      }
    },
    
    // === ФИОЛЕТОВЫЕ КАРТЫ ===
    {
      id: 'cultists_purple_10',
      name: 'Командир Армии Мертвых',
      type: 'purple',
      row: 'any',
      power: 5,
      armor: 2,
      health: 5,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'summon_from_deck',
        card: 'cultists_white_01',
        count: 1,
        description: 'При размещении Призывает 1 Демона из колоды'
      }
    },
    {
      id: 'cultists_purple_11',
      name: 'Чернокнижник',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 2,
      health: 5,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'active_charge',
        charges: 1,
        action: 'destroy_buff',
        description: 'Имеет 1 заряд. Может уничтожить карту рядом и увеличить свою силу на силу уничтоженной карты'
      }
    },
    {
      id: 'cultists_purple_12',
      name: 'Иоган Брахен',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 1,
      health: 5,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'add_charge',
        target: 'cultists_purple_11',
        value: 1,
        description: 'При размещении дает 1 заряд Чернокнижнику'
      }
    },
    {
      id: 'cultists_purple_17',
      name: 'Темный маг',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 1,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'destroy_own',
        target: 'own_field',
        description: 'При размещении уничтожьте карту на своем поле'
      }
    },
    {
      id: 'cultists_purple_18',
      name: 'Темный маг',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 1,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'destroy_own',
        target: 'own_field',
        description: 'При размещении уничтожьте карту на своем поле'
      }
    },
    {
      id: 'cultists_purple_25',
      name: 'Ангел смерти',
      type: 'purple',
      row: 'left',
      power: 4,
      armor: 2,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onDeath',
        action: 'add_charge',
        target: 'cultists_purple_11',
        value: 1,
        description: 'После смерти дает +1 заряд Чернокнижнику'
      }
    },
    {
      id: 'cultists_purple_26',
      name: 'Ангел смерти',
      type: 'purple',
      row: 'left',
      power: 4,
      armor: 2,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'onDeath',
        action: 'add_charge',
        target: 'cultists_purple_11',
        value: 1,
        description: 'После смерти дает +1 заряд Чернокнижнику'
      }
    },
    {
      id: 'cultists_purple_37',
      name: 'Призыватель',
      type: 'purple',
      row: 'any',
      power: 4,
      armor: 1,
      health: 4,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'revive',
        target: 'own_discard',
        combo: {
          ifCard: 'cultists_white_21',
          then: 'add_charge',
          target: 'cultists_purple_11'
        },
        description: 'Призовите любую карту из отбоя. Если это призрак, восполните заряд у Чернокнижника'
      }
    },
    {
      id: 'cultists_purple_38',
      name: 'Призыватель',
      type: 'purple',
      row: 'any',
      power: 4,
      armor: 1,
      health: 4,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'revive',
        target: 'own_discard',
        combo: {
          ifCard: 'cultists_white_21',
          then: 'add_charge',
          target: 'cultists_purple_11'
        },
        description: 'Призовите любую карту из отбоя. Если это призрак, восполните заряд у Чернокнижника'
      }
    },
    
    // === ОСОБЫЕ КАРТЫ ===
    {
      id: 'cultists_special_27',
      name: 'Проклятие',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        value: 2,
        stat: 'health',
        trigger: 'turn_start',
        description: 'Накладывает проклятие на карту. Каждый ход карта теряет 2 единицы здоровья'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_28',
      name: 'Проклятие',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        value: 2,
        stat: 'health',
        trigger: 'turn_start',
        description: 'Накладывает проклятие на карту. Каждый ход карта теряет 2 единицы здоровья'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_29',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_30',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_31',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_32',
      name: 'Проклятие',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        value: 2,
        stat: 'health',
        trigger: 'turn_start',
        description: 'Накладывает проклятие на карту. Каждый ход карта теряет 2 единицы здоровья'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_33',
      name: 'Проклятие',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        value: 2,
        stat: 'health',
        trigger: 'turn_start',
        description: 'Накладывает проклятие на карту. Каждый ход карта теряет 2 единицы здоровья'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_34',
      name: 'Пламя Лилии',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'destroy',
        target: 'enemy_unit',
        exclude: 'gold',
        description: 'Уничтожает любую карту противника, но не золотую'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_35',
      name: 'Пламя Лилии',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'destroy',
        target: 'enemy_unit',
        exclude: 'gold',
        description: 'Уничтожает любую карту противника, но не золотую'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_36',
      name: 'Призыв мертвых',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'transform',
        target: 'own_field',
        into: 'cultists_purple_25',
        description: 'Меняет карту на вашем поле на Ангела Смерти'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_39',
      name: 'Подношение Лилии',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'destroy_buff',
        condition: 'cultists_purple_11_on_field',
        target: 'own_field',
        buffTarget: 'cultists_purple_11',
        description: 'Если на поле есть Чернокнижник, уничтожьте любую свою карту и увеличьте силу Чернокнижника на силу этого отряда'
      },
      discardAfterUse: true
    },
    {
      id: 'cultists_special_45',
      name: 'Апокалипсис',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'destroy',
        target: 'enemy_unit_selectable',
        description: 'Уничтожает любую карту противника'
      },
      discardAfterUse: true
    },
    
    // === ЗОЛОТЫЕ КАРТЫ ===
    {
      id: 'cultists_gold_40',
      name: 'Черная Лилия',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 2,
      health: 3,
      influence: 15,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'summon',
        card: 'cultists_white_13',
        count: 2,
        position: 'adjacent',
        description: 'При размещении Создает рядом 2 карты Падальщика'
      }
    },
    {
      id: 'cultists_gold_41',
      name: 'Смерть',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 2,
      health: 4,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'passive_combo',
        condition: 'apocalypse_set',
        summon: 'cultists_special_45',
        description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис'
      }
    },
    {
      id: 'cultists_gold_42',
      name: 'Голод',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 2,
      health: 4,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'passive_combo',
        condition: 'apocalypse_set',
        summon: 'cultists_special_45',
        description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис'
      }
    },
    {
      id: 'cultists_gold_43',
      name: 'Война',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 2,
      health: 4,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'passive_combo',
        condition: 'apocalypse_set',
        summon: 'cultists_special_45',
        description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис'
      }
    },
    {
      id: 'cultists_gold_44',
      name: 'Чума',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 2,
      health: 4,
      influence: 10,
      maxInDeck: 1,
      effect: {
        type: 'passive_combo',
        condition: 'apocalypse_set',
        summon: 'cultists_special_45',
        description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис'
      }
    }
  ], // конец массива cards
  
  // === ЛИДЕРЫ ФРАКЦИИ ===
  leaders: [
    {
      id: 'cultists_leader_01',
      name: 'Черная Лилия',
      ability: {
        type: 'summon',
        card: 'cultists_white_21',
        usage: 3,
        description: 'Создайте 1 призрака. Максимум 3 раза можно использовать'
      },
      usage: '3_charges'
    },
    {
      id: 'cultists_leader_02',
      name: 'Апокалипсис',
      ability: {
        type: 'summon_from_deck',
        cards: ['cultists_gold_41', 'cultists_gold_42', 'cultists_gold_43', 'cultists_gold_44'],
        description: 'Призовите одного из вестников (Голод, Смерть, Чума, Война) из колоды'
      },
      usage: 'once_per_game'
    },
    {
      id: 'cultists_leader_03',
      name: 'Леди Жизель',
      ability: {
        type: 'add_charge',
        target: 'cultists_purple_11',
        description: 'Восполните заряд Чернокнижника'
      },
      usage: 'once_per_game'
    }
  ]
}; // конец FACTIONS.cultists
// -------------------------------------------
// ФРАКЦИЯ 4: ДРИАДЫ ЛЕСА НИДОЛИОН (Салатовый)
// -------------------------------------------
FACTIONS.dryads = {
  id: 'dryads',
  name: 'Дриады леса Нидолион',
  color: '#2ecc71',
  cards: [
    // === БЕЛЫЕ КАРТЫ ===
    {
      id: 'dryads_white_01',
      name: 'Лучник Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 4,
      armor: 1,
      health: 3,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении наносит 1 урон карте противника'
      },
      effect2: {
        type: 'onMove',
        action: 'buff',
        value: 1,
        stat: 'power',
        description: 'При перемещении в другой ряд увеличивает силу на 1'
      }
    },
    {
      id: 'dryads_white_02',
      name: 'Лучник Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 4,
      armor: 1,
      health: 3,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении наносит 1 урон карте противника'
      },
      effect2: {
        type: 'onMove',
        action: 'buff',
        value: 1,
        stat: 'power',
        description: 'При перемещении в другой ряд увеличивает силу на 1'
      }
    },
    {
      id: 'dryads_white_03',
      name: 'Лучник Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 4,
      armor: 1,
      health: 3,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении наносит 1 урон карте противника'
      },
      effect2: {
        type: 'onMove',
        action: 'buff',
        value: 1,
        stat: 'power',
        description: 'При перемещении в другой ряд увеличивает силу на 1'
      }
    },
    {
      id: 'dryads_white_04',
      name: 'Лучник Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 4,
      armor: 1,
      health: 3,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'damage',
        value: 1,
        target: 'enemy_unit',
        description: 'При размещении наносит 1 урон карте противника'
      },
      effect2: {
        type: 'onMove',
        action: 'buff',
        value: 1,
        stat: 'power',
        description: 'При перемещении в другой ряд увеличивает силу на 1'
      }
    },
    {
      id: 'dryads_white_05',
      name: 'Дриады Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 3,
      armor: 1,
      health: 4,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onHeal',
        action: 'move',
        target: 'own_field',
        description: 'Когда Дриада увеличивает свое здоровье она перемещает Любой отряд на своем поле в другой ряд'
      }
    },
    {
      id: 'dryads_white_06',
      name: 'Дриады Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 3,
      armor: 1,
      health: 4,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onHeal',
        action: 'move',
        target: 'own_field',
        description: 'Когда Дриада увеличивает свое здоровье она перемещает Любой отряд на своем поле в другой ряд'
      }
    },
    {
      id: 'dryads_white_07',
      name: 'Дриады Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 3,
      armor: 1,
      health: 4,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onHeal',
        action: 'move',
        target: 'own_field',
        description: 'Когда Дриада увеличивает свое здоровье она перемещает Любой отряд на своем поле в другой ряд'
      }
    },
    {
      id: 'dryads_white_08',
      name: 'Дриады Леса Нидолион',
      type: 'white',
      row: 'any',
      power: 3,
      armor: 1,
      health: 4,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'onHeal',
        action: 'move',
        target: 'own_field',
        description: 'Когда Дриада увеличивает свое здоровье она перемещает Любой отряд на своем поле в другой ряд'
      }
    },
    
    // === СЕРЫЕ КАРТЫ ===
    {
      id: 'dryads_gray_09',
      name: 'Хранитель Леса',
      type: 'gray',
      row: 'any',
      power: 6,
      armor: 2,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'active_charge',
        charges: 3,
        action: 'move',
        target: 'own_field',
        description: 'Разходует свой заряд для перемещения одной карты в другой ряд. Заряда 3'
      }
    },
    {
      id: 'dryads_gray_10',
      name: 'Хранитель Леса',
      type: 'gray',
      row: 'any',
      power: 6,
      armor: 2,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'active_charge',
        charges: 3,
        action: 'move',
        target: 'own_field',
        description: 'Разходует свой заряд для перемещения одной карты в другой ряд. Заряда 3'
      }
    },
    {
      id: 'dryads_gray_37',
      name: 'Дети Леса',
      type: 'gray',
      row: 'any',
      power: 4,
      armor: 1,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'synergy_row',
        condition: 'two_same_name_in_row',
        action: 'buff',
        value: 4,
        stat: 'power',
        description: 'Если в ряду 2 Дитя Леса, то каждый из них получает +4 силы'
      }
    },
    {
      id: 'dryads_gray_38',
      name: 'Дети Леса',
      type: 'gray',
      row: 'any',
      power: 4,
      armor: 1,
      health: 4,
      influence: 6,
      maxInDeck: 2,
      effect: {
        type: 'synergy_row',
        condition: 'two_same_name_in_row',
        action: 'buff',
        value: 4,
        stat: 'power',
        description: 'Если в ряду 2 Дитя Леса, то каждый из них получает +4 силы'
      }
    },
    
    // === ФИОЛЕТОВЫЕ КАРТЫ ===
    {
      id: 'dryads_purple_11',
      name: 'Лучники Долины',
      type: 'purple',
      row: 'any',
      power: 5,
      armor: 1,
      health: 5,
      influence: 8,
      maxInDeck: 4,
      effect: {
        type: 'onMove',
        action: 'damage',
        value: 2,
        target: 'enemy_unit',
        description: 'При перемещении в другой ряд наносит 2 урона Любой карте противника'
      }
    },
    {
      id: 'dryads_purple_12',
      name: 'Лучники Долины',
      type: 'purple',
      row: 'any',
      power: 5,
      armor: 1,
      health: 5,
      influence: 8,
      maxInDeck: 4,
      effect: {
        type: 'onMove',
        action: 'damage',
        value: 2,
        target: 'enemy_unit',
        description: 'При перемещении в другой ряд наносит 2 урона Любой карте противника'
      }
    },
    {
      id: 'dryads_purple_13',
      name: 'Лучники Долины',
      type: 'purple',
      row: 'any',
      power: 5,
      armor: 1,
      health: 5,
      influence: 8,
      maxInDeck: 4,
      effect: {
        type: 'onMove',
        action: 'damage',
        value: 2,
        target: 'enemy_unit',
        description: 'При перемещении в другой ряд наносит 2 урона Любой карте противника'
      }
    },
    {
      id: 'dryads_purple_14',
      name: 'Лучники Долины',
      type: 'purple',
      row: 'any',
      power: 5,
      armor: 1,
      health: 5,
      influence: 8,
      maxInDeck: 4,
      effect: {
        type: 'onMove',
        action: 'damage',
        value: 2,
        target: 'enemy_unit',
        description: 'При перемещении в другой ряд наносит 2 урона Любой карте противника'
      }
    },
    {
      id: 'dryads_purple_15',
      name: 'Разведчики Леса',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 1,
      health: 3,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'play_from_deck',
        card: 'dryads_special_27',
        description: 'При размещении сыграйте карту Ловушка'
      }
    },
    {
      id: 'dryads_purple_16',
      name: 'Разведчики Леса',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 1,
      health: 3,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'play_from_deck',
        card: 'dryads_special_27',
        description: 'При размещении сыграйте карту Ловушка'
      }
    },
    {
      id: 'dryads_purple_17',
      name: 'Разведчики Леса',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 1,
      health: 3,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'play_from_deck',
        card: 'dryads_special_27',
        description: 'При размещении сыграйте карту Ловушка'
      }
    },
    {
      id: 'dryads_purple_18',
      name: 'Разведчики Леса',
      type: 'purple',
      row: 'any',
      power: 3,
      armor: 1,
      health: 3,
      influence: 5,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'play_from_deck',
        card: 'dryads_special_27',
        description: 'При размещении сыграйте карту Ловушка'
      }
    },
    {
      id: 'dryads_purple_19',
      name: 'Ниолина Прекрасная',
      type: 'purple',
      row: 'right',
      power: 8,
      armor: 3,
      health: 4,
      influence: 8,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'buff_adjacent',
        value: 3,
        stat: 'power',
        description: 'При размещении дает +3 силы карте слева и +3 силы карте справа от нее'
      }
    },
    {
      id: 'dryads_purple_20',
      name: 'Древо мира',
      type: 'purple',
      row: 'any',
      power: 4,
      armor: 4,
      health: 8,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'move_row',
        target: 'own_field',
        count: 2,
        description: 'При размещении переместите 2 карты на своем поле в этом ряду в другой'
      }
    },
    {
      id: 'dryads_purple_21',
      name: 'Древо мира',
      type: 'purple',
      row: 'any',
      power: 4,
      armor: 4,
      health: 8,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'onPlay',
        action: 'move_row',
        target: 'own_field',
        count: 2,
        description: 'При размещении переместите 2 карты на своем поле в этом ряду в другой'
      }
    },
    {
      id: 'dryads_purple_22',
      name: 'Целитель',
      type: 'purple',
      row: 'any',
      power: 4,
      armor: 0,
      health: 3,
      influence: 8,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'heal_row',
        value: 3,
        description: 'При размещении все карты в ряду получают по +3 здоровья'
      }
    },
    {
      id: 'dryads_purple_23',
      name: 'Целитель',
      type: 'purple',
      row: 'any',
      power: 4,
      armor: 0,
      health: 3,
      influence: 8,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'heal_row',
        value: 3,
        description: 'При размещении все карты в ряду получают по +3 здоровья'
      }
    },
    {
      id: 'dryads_purple_24',
      name: 'Целитель',
      type: 'purple',
      row: 'any',
      power: 4,
      armor: 0,
      health: 3,
      influence: 8,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'heal_row',
        value: 3,
        description: 'При размещении все карты в ряду получают по +3 здоровья'
      }
    },
    {
      id: 'dryads_purple_25',
      name: 'Дриада Воительница',
      type: 'purple',
      row: 'any',
      power: 6,
      armor: 2,
      health: 4,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'passive',
        trigger: 'ally_move',
        action: 'buff',
        value: 1,
        stat: 'power',
        description: 'Получает +1 к силе если из данного ряда Любой карта перешла в другой ряд'
      }
    },
    {
      id: 'dryads_purple_26',
      name: 'Дриада Воительница',
      type: 'purple',
      row: 'any',
      power: 6,
      armor: 2,
      health: 4,
      influence: 8,
      maxInDeck: 2,
      effect: {
        type: 'passive',
        trigger: 'ally_move',
        action: 'buff',
        value: 1,
        stat: 'power',
        description: 'Получает +1 к силе если из данного ряда Любой карта перешла в другой ряд'
      }
    },
    
    // === ОСОБЫЕ КАРТЫ ===
    {
      id: 'dryads_special_27',
      name: 'Ловушка',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'trap',
        trigger: 'enemy_buff',
        action: 'damage',
        value: 3,
        description: 'Если карта противника получила силу нанесите ей 3 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_28',
      name: 'Ловушка',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'trap',
        trigger: 'enemy_buff',
        action: 'damage',
        value: 3,
        description: 'Если карта противника получила силу нанесите ей 3 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_29',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_30',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_31',
      name: 'Чучело',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 5,
      maxInDeck: 3,
      effect: {
        type: 'onPlay',
        action: 'return_to_hand',
        target: 'own_field',
        description: 'При размещении верните любую карту со своего поля себе в руку'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_32',
      name: 'Ловушка',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'trap',
        trigger: 'enemy_buff',
        action: 'damage',
        value: 3,
        description: 'Если карта противника получила силу нанесите ей 3 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_33',
      name: 'Ловушка',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 4,
      maxInDeck: 4,
      effect: {
        type: 'trap',
        trigger: 'enemy_buff',
        action: 'damage',
        value: 3,
        description: 'Если карта противника получила силу нанесите ей 3 урона'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_34',
      name: 'Путы ярости',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        target: 'enemy_unit',
        trigger: 'damage',
        buff: { charges: 2, target: 'dryads_gray_09' },
        description: 'Выберите карту противника, если она получит урон, то Хранитель Леса получит +2 заряда'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_35',
      name: 'Путы ярости',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        target: 'enemy_unit',
        trigger: 'damage',
        buff: { charges: 2, target: 'dryads_gray_09' },
        description: 'Выберите карту противника, если она получит урон, то Хранитель Леса получит +2 заряда'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_36',
      name: 'Путы ярости',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        target: 'enemy_unit',
        trigger: 'damage',
        buff: { charges: 2, target: 'dryads_gray_09' },
        description: 'Выберите карту противника, если она получит урон, то Хранитель Леса получит +2 заряда'
      },
      discardAfterUse: true
    },
    {
      id: 'dryads_special_39',
      name: 'Путы ярости',
      type: 'special',
      row: 'any',
      power: 0,
      armor: 0,
      health: 0,
      influence: 6,
      maxInDeck: 4,
      effect: {
        type: 'onPlay',
        action: 'curse',
        target: 'enemy_unit',
        trigger: 'damage',
        buff: { charges: 2, target: 'dryads_gray_09' },
        description: 'Выберите карту противника, если она получит урон, то Хранитель Леса получит +2 заряда'
      },
      discardAfterUse: true
    },
    
    // === ЗОЛОТЫЕ КАРТЫ ===
    {
      id: 'dryads_gold_40',
      name: 'Тарик Стрелок',
      type: 'gold',
      row: 'right',
      power: 10,
      armor: 2,
      health: 5,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'passive',
        trigger: 'enemy_buff',
        action: 'damage',
        value: 2,
        target: 'enemy_unit',
        description: 'Наносит 2 урона карте противника которой увеличили силу'
      }
    },
    {
      id: 'dryads_gold_41',
      name: 'Древо жизни Нидолиона',
      type: 'gold',
      row: 'left',
      power: 5,
      armor: 4,
      health: 8,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'passive_aura',
        action: 'ignore_damage',
        target: 'row',
        description: 'Пока Древо жизни находится на поле, карты в этом ряду игнорируют урон от противника'
      }
    },
    {
      id: 'dryads_gold_42',
      name: 'Элиона',
      type: 'gold',
      row: 'any',
      power: 4,
      armor: 2,
      health: 6,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'passive',
        trigger: 'enemy_death',
        condition: 'dryads_purple_11_in_row',
        action: 'buff',
        value: 2,
        stat: 'power',
        description: 'Если с Элионой в одном ряду есть Лучники Долины, каждый из них получает +2 к силе за каждую уничтоженную карту противника'
      }
    },
    {
      id: 'dryads_gold_43',
      name: 'Агнес дитя леса',
      type: 'gold',
      row: 'right',
      power: 2,
      armor: 1,
      health: 4,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'buff',
        value: 4,
        stat: 'power',
        target: 'dryads_gray_37',
        description: 'При размещении все Дети Леса получают по +4 к силе'
      }
    },
    {
      id: 'dryads_gold_44',
      name: 'Саллия из Нидолиона',
      type: 'gold',
      row: 'any',
      power: 3,
      armor: 1,
      health: 6,
      influence: 12,
      maxInDeck: 1,
      effect: {
        type: 'passive_hand',
        trigger: 'trap_played',
        action: 'buff',
        value: 2,
        stat: 'power',
        description: 'Если Саллия находится в руке, она получает +2 к силе за каждую сыгранную ловушку'
      }
    },
    {
      id: 'dryads_gold_45',
      name: 'Повелительница Дриад Элиана',
      type: 'gold',
      row: 'any',
      power: 8,
      armor: 2,
      health: 10,
      influence: 15,
      maxInDeck: 1,
      effect: {
        type: 'onPlay',
        action: 'reset_leader',
        description: 'При размещении Дает возможность лидеру использовать свой Эффект снова'
      }
    }
  ], // конец массива cards
  
  // === ЛИДЕРЫ ФРАКЦИИ ===
  leaders: [
    {
      id: 'dryads_leader_01',
      name: 'Принцесса Элиана',
      ability: {
        type: 'play_from_deck',
        cardType: 'special',
        description: 'Сыграйте любую ловушку из вашей колоды'
      },
      usage: 'once_per_game'
    },
    {
      id: 'dryads_leader_02',
      name: 'Королева Элиана',
      ability: {
        type: 'move_row',
        charges: 3,
        target: 'own_field',
        description: 'Переместите отряд в другой ряд. Макс 3 заряда'
      },
      usage: '3_charges'
    },
    {
      id: 'dryads_leader_03',
      name: 'Элиана Воительница',
      ability: {
        type: 'damage',
        value: 6,
        target: 'enemy_unit',
        description: 'Нанесите 6 урона любой карте противника'
      },
      usage: 'once_per_game'
    }
  ]
}; // конец FACTIONS.dryads

// ===========================================
// ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ В ДРУГИХ ФАЙЛАХ
// ===========================================

// Для браузеров (глобальная переменная)
if (typeof window !== 'undefined') {
  window.GAME_CONFIG = GAME_CONFIG;
  window.COLORS = COLORS;
  window.FACTIONS = FACTIONS;
}

// Для Node.js (модули)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAME_CONFIG, COLORS, FACTIONS };
}

// ===========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===========================================

// Получить карту по ID
function getCardById(cardId) {
  for (const factionKey in FACTIONS) {
    const faction = FACTIONS[factionKey];
    const card = faction.cards.find(c => c.id === cardId);
    if (card) return { ...card, faction: factionKey };
  }
  return null;
}

// Получить лидера по ID
function getLeaderById(leaderId) {
  for (const factionKey in FACTIONS) {
    const faction = FACTIONS[factionKey];
    const leader = faction.leaders.find(l => l.id === leaderId);
    if (leader) return { ...leader, faction: factionKey };
  }
  return null;
}

// Проверить валидность колоды
function validateDeck(cards, factionKey) {
  const faction = FACTIONS[factionKey];
  if (!faction) return { valid: false, error: 'Фракция не найдена' };
  
  // Проверка размера
  if (cards.length !== GAME_CONFIG.maxDeckSize) {
    return { valid: false, error: `В колоде должно быть ${GAME_CONFIG.maxDeckSize} карт (сейчас ${cards.length})` };
  }
  
  // Подсчёт влияния
  let totalInfluence = 0;
  const cardCounts = {};
  
  for (const cardId of cards) {
    const card = getCardById(cardId);
    if (!card) continue;
    
    totalInfluence += card.influence;
    cardCounts[cardId] = (cardCounts[cardId] || 0) + 1;
    
    // Проверка лимита копий
    if (cardCounts[cardId] > card.maxInDeck) {
      return { valid: false, error: `Карту "${card.name}" можно добавить максимум ${card.maxInDeck} шт.` };
    }
  }
  
  // Проверка лимита влияния
  if (totalInfluence > GAME_CONFIG.maxInfluence) {
    return { valid: false, error: `Превышен лимит влияния (${totalInfluence}/${GAME_CONFIG.maxInfluence})` };
  }
  
  return { valid: true, influence: totalInfluence };
}

// Добавить вспомогательные функции в глобальную область
if (typeof window !== 'undefined') {
  window.getCardById = getCardById;
  window.getLeaderById = getLeaderById;
  window.validateDeck = validateDeck;
}

// ===========================================
// КОНЕЦ ФАЙЛА CONFIG.JS
// ===========================================
console.log('✅ Config loaded:', Object.keys(FACTIONS).length, 'factions,', 
  Object.values(FACTIONS).reduce((sum, f) => sum + f.cards.length, 0), 'cards total');

