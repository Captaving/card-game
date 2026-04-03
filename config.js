// === КОНФИГУРАЦИЯ ИГРЫ ===
const GAME_CONFIG = {
  maxDeckSize: 25,
  maxInfluence: 150,
  maxCardsPerRow: 4,
  rounds: 3
};

// === ФРАКЦИИ И КАРТЫ ===
const FACTIONS = {};

// ФРАКЦИЯ 1: РЫЦАРИ (Синий)
FACTIONS.knights = {
  id: 'knights',
  name: 'Рыцари Цветка Лилии',
  color: '#3498db',
  cards: [
    { id: 'knights_white_01', name: 'Пехотинец', type: 'white', row: 'left', power: 2, armor: 1, health: 2, influence: 2, maxInDeck: 3, effect: null },
    { id: 'knights_white_02', name: 'Лучник', type: 'white', row: 'right', power: 3, armor: 0, health: 2, influence: 3, maxInDeck: 3, effect: null },
    { id: 'knights_white_03', name: 'Щитоносец', type: 'white', row: 'left', power: 1, armor: 3, health: 3, influence: 3, maxInDeck: 3, effect: null },
    { id: 'knights_white_04', name: 'Кавалерист', type: 'white', row: 'left', power: 4, armor: 1, health: 2, influence: 4, maxInDeck: 2, effect: null },
    { id: 'knights_white_05', name: 'Капеллан', type: 'white', row: 'right', power: 2, armor: 1, health: 3, influence: 3, maxInDeck: 3, effect: { type: 'onPlay', action: 'heal', value: 2, target: 'own_unit', description: 'Исцеляет союзника на 2' } },
    { id: 'knights_white_06', name: 'Оруженосец', type: 'white', row: 'left', power: 2, armor: 2, health: 2, influence: 3, maxInDeck: 3, effect: null },
    { id: 'knights_white_07', name: 'Арбалетчик', type: 'white', row: 'right', power: 3, armor: 0, health: 2, influence: 3, maxInDeck: 3, effect: { type: 'onPlay', action: 'damage', value: 1, target: 'enemy_unit', description: 'Наносит 1 урон врагу' } },
    { id: 'knights_white_08', name: 'Рыцарь', type: 'white', row: 'left', power: 4, armor: 2, health: 3, influence: 5, maxInDeck: 2, effect: null },
    { id: 'knights_white_09', name: 'Знаменосец', type: 'white', row: 'right', power: 2, armor: 1, health: 3, influence: 3, maxInDeck: 3, effect: { type: 'onPlay', action: 'buff', value: 2, stat: 'power', target: 'adjacent', description: 'Усиливает соседнюю карту на +2' } },
    { id: 'knights_white_10', name: 'Страж', type: 'white', row: 'left', power: 2, armor: 3, health: 4, influence: 4, maxInDeck: 2, effect: null },
    { id: 'knights_gray_01', name: 'Наёмник', type: 'gray', row: 'left', power: 3, armor: 1, health: 2, influence: 4, maxInDeck: 3, effect: null },
    { id: 'knights_gray_02', name: 'Ветеран', type: 'gray', row: 'left', power: 4, armor: 2, health: 3, influence: 5, maxInDeck: 2, effect: null },
    { id: 'knights_gray_03', name: 'Сержант', type: 'gray', row: 'left', power: 3, armor: 2, health: 3, influence: 4, maxInDeck: 3, effect: { type: 'onPlay', action: 'buff', value: 1, stat: 'power', target: 'row', description: 'Усиливает ряд на +1' } },
    { id: 'knights_gray_04', name: 'Капитан', type: 'gray', row: 'left', power: 4, armor: 2, health: 4, influence: 6, maxInDeck: 2, effect: { type: 'onPlay', action: 'buff', value: 2, stat: 'power', target: 'row', description: 'Усиливает ряд на +2' } },
    { id: 'knights_gray_05', name: 'Генерал', type: 'gray', row: 'left', power: 5, armor: 3, health: 5, influence: 7, maxInDeck: 1, effect: null },
    { id: 'knights_purple_01', name: 'Паладин', type: 'purple', row: 'left', power: 5, armor: 3, health: 4, influence: 7, maxInDeck: 2, effect: { type: 'onPlay', action: 'heal', value: 3, target: 'own_unit', description: 'Исцеляет союзника на 3' } },
    { id: 'knights_purple_02', name: 'Маг Битвы', type: 'purple', row: 'right', power: 5, armor: 1, health: 3, influence: 6, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 2, target: 'enemy_unit', description: 'Наносит 2 урона врагу' } },
    { id: 'knights_purple_03', name: 'Братья Стали', type: 'purple', row: 'right', power: 3, armor: 2, health: 4, influence: 4, maxInDeck: 2, effect: { type: 'onPlay', action: 'buff', value: 2, stat: 'power', target: 'adjacent_same_name', description: 'При размещении рядом с Братья Стали увеличивает силу на +2' } },
    { id: 'knights_purple_04', name: 'Герой', type: 'purple', row: 'left', power: 7, armor: 3, health: 5, influence: 8, maxInDeck: 1, effect: null },
    { id: 'knights_gold_01', name: 'Король Аугуст', type: 'gold', row: 'left', power: 8, armor: 4, health: 6, influence: 10, maxInDeck: 1, effect: { type: 'onPlay', action: 'buff', value: 3, stat: 'power', target: 'all', description: 'Усиливает все карты на +3' } },
    { id: 'knights_gold_02', name: 'Дракон', type: 'gold', row: 'right', power: 10, armor: 3, health: 6, influence: 12, maxInDeck: 1, effect: { type: 'onPlay', action: 'damage', value: 5, target: 'all_enemy', description: 'Наносит 5 урона всем врагам' } },
    { id: 'knights_special_01', name: 'Боевой Клич', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 4, maxInDeck: 2, effect: { type: 'onPlay', action: 'buff', value: 3, stat: 'power', target: 'row', description: 'Усиливает ряд на +3' }, discardAfterUse: true },
    { id: 'knights_special_02', name: 'Тактика', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 3, maxInDeck: 2, effect: { type: 'onPlay', action: 'draw', value: 1, description: 'Взять 1 карту' }, discardAfterUse: true },
    { id: 'knights_special_03', name: 'Молитва', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 3, maxInDeck: 2, effect: { type: 'onPlay', action: 'heal', value: 3, target: 'all', description: 'Исцеляет все карты на 3' }, discardAfterUse: true },
    { id: 'knights_special_04', name: 'Атака', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 4, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 3, target: 'enemy_unit', description: 'Наносит 3 урона врагу' }, discardAfterUse: true }
  ],
  leaders: [
    { id: 'knights_leader_1', name: 'Король Аугуст Смелый', ability: { type: 'damage', value: 3, description: 'Наносит 3 урона карте противника' } },
    { id: 'knights_leader_2', name: 'Король Аугуст Победитель', ability: { type: 'heal', value: 5, description: 'Исцеляет все ваши карты на 5' } },
    { id: 'knights_leader_3', name: 'Король Аугуст Отважный', ability: { type: 'copy', description: 'Копирует способность лидера противника' } }
  ]
};

// ФРАКЦИЯ 2: МАГИ (Фиолетовый)
FACTIONS.mages = {
  id: 'mages',
  name: 'Орден Чародеев',
  color: '#926eae',
  cards: [
    { id: 'mages_white_01', name: 'Ученик', type: 'white', row: 'right', power: 2, armor: 0, health: 2, influence: 2, maxInDeck: 3, effect: null },
    { id: 'mages_white_02', name: 'Адепт', type: 'white', row: 'right', power: 3, armor: 0, health: 2, influence: 3, maxInDeck: 3, effect: { type: 'onPlay', action: 'damage', value: 1, target: 'enemy_unit', description: 'Наносит 1 урон' } },
    { id: 'mages_white_03', name: 'Маг', type: 'white', row: 'right', power: 4, armor: 1, health: 2, influence: 4, maxInDeck: 3, effect: null },
    { id: 'mages_white_04', name: 'Чародей', type: 'white', row: 'right', power: 4, armor: 1, health: 3, influence: 5, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 2, target: 'enemy_unit', description: 'Наносит 2 урона' } },
    { id: 'mages_white_05', name: 'Волшебник', type: 'white', row: 'right', power: 5, armor: 1, health: 3, influence: 5, maxInDeck: 2, effect: null },
    { id: 'mages_gray_01', name: 'Призыватель', type: 'gray', row: 'right', power: 3, armor: 1, health: 3, influence: 4, maxInDeck: 3, effect: { type: 'onPlay', action: 'summon', card: 'mages_white_01', count: 1, description: 'Призывает Ученика' } },
    { id: 'mages_gray_02', name: 'Некромант', type: 'gray', row: 'right', power: 4, armor: 1, health: 3, influence: 5, maxInDeck: 2, effect: { type: 'onPlay', action: 'summon', card: 'mages_white_02', count: 1, description: 'Призывает Адепта' } },
    { id: 'mages_gray_03', name: 'Демон', type: 'gray', row: 'right', power: 7, armor: 2, health: 4, influence: 7, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 3, target: 'enemy_unit', description: 'Наносит 3 урона' } },
    { id: 'mages_purple_01', name: 'Маг Огня', type: 'purple', row: 'right', power: 6, armor: 1, health: 3, influence: 7, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 3, target: 'enemy_unit', description: 'Наносит 3 урона' } },
    { id: 'mages_purple_02', name: 'Маг Льда', type: 'purple', row: 'right', power: 5, armor: 2, health: 4, influence: 7, maxInDeck: 2, effect: { type: 'onPlay', action: 'buff', value: 2, stat: 'armor', target: 'row', description: 'Усиливает броню ряда на +2' } },
    { id: 'mages_purple_03', name: 'Архимаг', type: 'purple', row: 'right', power: 9, armor: 4, health: 6, influence: 10, maxInDeck: 1, effect: { type: 'onPlay', action: 'damage', value: 5, target: 'all_enemy', description: 'Наносит 5 урона всем врагам' } },
    { id: 'mages_gold_01', name: 'Чародей Магнуссен', type: 'gold', row: 'right', power: 8, armor: 3, health: 5, influence: 10, maxInDeck: 1, effect: { type: 'onPlay', action: 'copy', description: 'Копирует способность последней сыгранной карты' } },
    { id: 'mages_gold_02', name: 'Верховный Чародей', type: 'gold', row: 'right', power: 10, armor: 5, health: 7, influence: 12, maxInDeck: 1, effect: { type: 'onPlay', action: 'destroy', target: 'all_enemy', description: 'Уничтожает все карты врага' } },
    { id: 'mages_special_01', name: 'Огненный Шар', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 4, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 4, target: 'enemy_unit', description: 'Наносит 4 урона' }, discardAfterUse: true },
    { id: 'mages_special_02', name: 'Призыв', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 4, maxInDeck: 2, effect: { type: 'onPlay', action: 'summon', card: 'mages_white_01', count: 2, description: 'Призывает 2 Учеников' }, discardAfterUse: true }
  ],
  leaders: [
    { id: 'mages_leader_1', name: 'Верховный Чародей', ability: { type: 'damage', value: 4, description: 'Наносит 4 урона карте противника' } },
    { id: 'mages_leader_2', name: 'Хранитель Магии', ability: { type: 'heal', value: 6, description: 'Исцеляет все ваши карты на 6' } },
    { id: 'mages_leader_3', name: 'Мастер Копирования', ability: { type: 'copy', description: 'Копирует последнюю способность противника' } }
  ]
};

// ФРАКЦИЯ 3: КУЛЬТИСТЫ (Серый)
FACTIONS.cultists = {
  id: 'cultists',
  name: 'Прислужники Черной Лилии',
  color: '#555555',
  cards: [
    { id: 'cultists_white_01', name: 'Культ', type: 'white', row: 'left', power: 2, armor: 1, health: 2, influence: 2, maxInDeck: 3, effect: null },
    { id: 'cultists_white_02', name: 'Аколит', type: 'white', row: 'left', power: 3, armor: 1, health: 2, influence: 3, maxInDeck: 3, effect: null },
    { id: 'cultists_white_03', name: 'Жрец', type: 'white', row: 'right', power: 3, armor: 1, health: 3, influence: 3, maxInDeck: 3, effect: { type: 'onPlay', action: 'heal', value: 2, target: 'own_unit', description: 'Исцеляет союзника на 2' } },
    { id: 'cultists_white_04', name: 'Рыцарь', type: 'white', row: 'left', power: 4, armor: 2, health: 3, influence: 4, maxInDeck: 3, effect: null },
    { id: 'cultists_white_05', name: 'Инквизитор', type: 'white', row: 'right', power: 4, armor: 2, health: 3, influence: 5, maxInDeck: 2, effect: { type: 'onPlay', action: 'destroy', target: 'enemy_unit', description: 'Уничтожает карту врага' } },
    { id: 'cultists_gray_01', name: 'Убийца', type: 'gray', row: 'right', power: 4, armor: 1, health: 2, influence: 4, maxInDeck: 3, effect: { type: 'onPlay', action: 'damage', value: 2, target: 'enemy_unit', description: 'Наносит 2 урона' } },
    { id: 'cultists_gray_02', name: 'Ассасин', type: 'gray', row: 'right', power: 6, armor: 1, health: 3, influence: 6, maxInDeck: 2, effect: { type: 'onPlay', action: 'destroy', target: 'enemy_unit', description: 'Уничтожает карту врага' } },
    { id: 'cultists_gray_03', name: 'Демон', type: 'gray', row: 'right', power: 7, armor: 3, health: 4, influence: 8, maxInDeck: 1, effect: { type: 'onPlay', action: 'damage', value: 4, target: 'enemy_unit', description: 'Наносит 4 урона' } },
    { id: 'cultists_purple_01', name: 'Некромант', type: 'purple', row: 'right', power: 5, armor: 2, health: 4, influence: 6, maxInDeck: 2, effect: { type: 'onPlay', action: 'summon', card: 'cultists_white_01', count: 1, description: 'Призывает Культиста' } },
    { id: 'cultists_purple_02', name: 'Чернокнижник', type: 'purple', row: 'right', power: 6, armor: 2, health: 4, influence: 7, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 3, target: 'enemy_unit', description: 'Наносит 3 урона' } },
    { id: 'cultists_purple_03', name: 'Жнец', type: 'purple', row: 'right', power: 8, armor: 3, health: 5, influence: 8, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 5, target: 'enemy_unit', description: 'Наносит 5 урона' } },
    { id: 'cultists_gold_41', name: 'Смерть', type: 'gold', row: 'any', power: 8, armor: 2, health: 4, influence: 10, maxInDeck: 1, effect: { type: 'passive', action: 'apocalypse_combo', description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис' } },
    { id: 'cultists_gold_42', name: 'Голод', type: 'gold', row: 'any', power: 8, armor: 2, health: 4, influence: 10, maxInDeck: 1, effect: { type: 'passive', action: 'apocalypse_combo', description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис' } },
    { id: 'cultists_gold_43', name: 'Война', type: 'gold', row: 'any', power: 8, armor: 2, health: 4, influence: 10, maxInDeck: 1, effect: { type: 'passive', action: 'apocalypse_combo', description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис' } },
    { id: 'cultists_gold_44', name: 'Чума', type: 'gold', row: 'any', power: 8, armor: 2, health: 4, influence: 10, maxInDeck: 1, effect: { type: 'passive', action: 'apocalypse_combo', description: 'Если в Ряду находится Война, Чума и Голод, призывает из колоды Апокалипсис' } },
    { id: 'cultists_special_45', name: 'Апокалипсис', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 12, maxInDeck: 1, effect: { type: 'onPlay', action: 'destroy', target: 'enemy_unit_selectable', description: 'Уничтожает любую карту противника' }, discardAfterUse: true },
    { id: 'cultists_special_01', name: 'Ритуал', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 4, maxInDeck: 2, effect: { type: 'onPlay', action: 'summon', card: 'cultists_white_01', count: 2, description: 'Призывает 2 Культистов' }, discardAfterUse: true },
    { id: 'cultists_special_02', name: 'Проклятие', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 4, maxInDeck: 2, effect: { type: 'onPlay', action: 'damage', value: 4, target: 'enemy_unit', description: 'Наносит 4 урона' }, discardAfterUse: true }
  ],
  leaders: [
    { id: 'cultists_leader_1', name: 'Верховный Жрец', ability: { type: 'damage', value: 4, description: 'Наносит 4 урона карте противника' } },
    { id: 'cultists_leader_2', name: 'Тёмный Маг', ability: { type: 'destroy', description: 'Уничтожает карту противника' } },
    { id: 'cultists_leader_3', name: 'Слуга Тьмы', ability: { type: 'summon', card: 'cultists_white_01', description: 'Призывает Культиста' } }
  ]
};

// ФРАКЦИЯ 4: ДРИАДЫ (Зелёный)
FACTIONS.dryads = {
  id: 'dryads',
  name: 'Дриады леса Нидолион',
  color: '#2ecc71',
  cards: [
    { id: 'dryads_white_01', name: 'Дриада', type: 'white', row: 'left', power: 2, armor: 1, health: 3, influence: 2, maxInDeck: 3, effect: null },
    { id: 'dryads_white_02', name: 'Эльф', type: 'white', row: 'right', power: 3, armor: 1, health: 2, influence: 3, maxInDeck: 3, effect: null },
    { id: 'dryads_white_03', name: 'Лучник', type: 'white', row: 'right', power: 4, armor: 0, health: 2, influence: 4, maxInDeck: 3, effect: { type: 'onPlay', action: 'damage', value: 1, target: 'enemy_unit', description: 'Наносит 1 урон' } },
    { id: 'dryads_white_04', name: 'Воин', type: 'white', row: 'left', power: 4, armor: 2, health: 3, influence: 4, maxInDeck: 3, effect: null },
    { id: 'dryads_white_05', name: 'Друид', type: 'white', row: 'right', power: 3, armor: 1, health: 3, influence: 4, maxInDeck: 3, effect: { type: 'onPlay', action: 'heal', value: 2, target: 'own_unit', description: 'Исцеляет союзника на 2' } },
    { id: 'dryads_gray_01', name: 'Волк', type: 'gray', row: 'left', power: 3, armor: 1, health: 3, influence: 3, maxInDeck: 3, effect: null },
    { id: 'dryads_gray_02', name: 'Медведь', type: 'gray', row: 'left', power: 5, armor: 2, health: 4, influence: 5, maxInDeck: 2, effect: null },
    { id: 'dryads_gray_03', name: 'Орёл', type: 'gray', row: 'right', power: 4, armor: 1, health: 2, influence: 4, maxInDeck: 3, effect: { type: 'onPlay', action: 'damage', value: 2, target: 'enemy_unit', description: 'Наносит 2 урона' } },
    { id: 'dryads_purple_01', name: 'Древний Дуб', type: 'purple', row: 'left', power: 5, armor: 4, health: 6, influence: 7, maxInDeck: 2, effect: { type: 'onPlay', action: 'heal', value: 3, target: 'all', description: 'Исцеляет все карты на 3' } },
    { id: 'dryads_purple_02', name: 'Хранитель Леса', type: 'purple', row: 'left', power: 6, armor: 3, health: 5, influence: 7, maxInDeck: 2, effect: { type: 'onPlay', action: 'buff', value: 3, stat: 'power', target: 'row', description: 'Усиливает ряд на +3' } },
    { id: 'dryads_purple_03', name: 'Мать Природа', type: 'purple', row: 'right', power: 7, armor: 3, health: 5, influence: 9, maxInDeck: 1, effect: { type: 'onPlay', action: 'heal', value: 5, target: 'all', description: 'Исцеляет все карты на 5' } },
    { id: 'dryads_gold_01', name: 'Король Эльфов', type: 'gold', row: 'left', power: 8, armor: 4, health: 6, influence: 10, maxInDeck: 1, effect: { type: 'onPlay', action: 'buff', value: 3, stat: 'power', target: 'all', description: 'Усиливает все карты на +3' } },
    { id: 'dryads_gold_02', name: 'Королева Дриад', type: 'gold', row: 'right', power: 7, armor: 3, health: 6, influence: 10, maxInDeck: 1, effect: { type: 'onPlay', action: 'heal', value: 5, target: 'all', description: 'Исцеляет все карты на 5' } },
    { id: 'dryads_special_01', name: 'Рост', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 3, maxInDeck: 2, effect: { type: 'onPlay', action: 'buff', value: 3, stat: 'power', target: 'row', description: 'Усиливает ряд на +3' }, discardAfterUse: true },
    { id: 'dryads_special_02', name: 'Исцеление', type: 'special', row: 'any', power: 0, armor: 0, health: 0, influence: 3, maxInDeck: 2, effect: { type: 'onPlay', action: 'heal', value: 4, target: 'own_unit', description: 'Исцеляет союзника на 4' }, discardAfterUse: true }
  ],
  leaders: [
    { id: 'dryads_leader_1', name: 'Верховный Друид', ability: { type: 'heal', value: 5, description: 'Исцеляет все ваши карты на 5' } },
    { id: 'dryads_leader_2', name: 'Король Леса', ability: { type: 'buff', value: 3, stat: 'power', description: 'Усиливает все ваши карты на +3' } },
    { id: 'dryads_leader_3', name: 'Мать Природы', ability: { type: 'summon', card: 'dryads_gray_01', description: 'Призывает Волка' } }
  ]
};