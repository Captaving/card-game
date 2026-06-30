const GAME_CONFIG = {
    maxDeckSize: 25,
    maxInfluence: 170,
    startingHand: 10
};

// ==================== НЕЙТРАЛЬНЫЕ КАРТЫ ====================
const NEUTRAL_CARDS = [
    { id: "n1", name: "Чучело", type: "special", line: "any", power: 0, influence: 8, maxCopies: 3, effect: "При размещении верните любую карту со своего поля себе в руку." },
    { id: "n2", name: "Бомба", type: "special", line: "any", power: 0, influence: 4, maxCopies: 4, effect: "При размещении нанесите противнику 4 урона." },
    { id: "n3", name: "Проклятие", type: "special", line: "any", power: 0, influence: 4, maxCopies: 4, effect: "Накладывает проклятие на карту. 3 хода карта получает по 2 урона за ход." },
    { id: "n6", name: "Портал", type: "special", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "При размещении из колоды выйдет на поле любые 2 карты влияние которых до 6." }
];

// ==================== ФРАКЦИИ ====================
const FACTIONS = {
    knights: {
        id: 'knights',
        name: "Рыцари Цветка Лилии",
        color: "#1565c0",
        emblem: "images/Рыцари Цветка Лилии.png",
        leaders: [
            { id: "king_brave", name: "Король Аугуст Роззен Смелый", effect: "При размещении в ряду карты с эффектом размещения активируют умения повторно" },
            { id: "king_courage", name: "Король Аугуст Роззен Отважный", effect: "Отменяет умение лидера фракции противника" },
            { id: "king_victory", name: "Король Аугуст Роззен Победитель", effect: "Дает всем вашим картам на поле +1 к силе" }
        ],
        cards: [
            { id: "k1", name: "Пехотинец", type: "white", line: "left", power: 2, influence: 2, maxCopies: 3, effect: "Базовый воин." },
            { id: "k2", name: "Рыцарь Ордена", type: "gray", line: "left", power: 5, influence: 4, maxCopies: 2, effect: "Стандартный рыцарь." },
            { id: "k3", name: "Знаменосец", type: "gray", line: "left", power: 5, influence: 4, maxCopies: 2, effect: "Воодушевляет союзников." },
            { id: "k4", name: "Воин Света", type: "purple", line: "left", power: 6, influence: 5, maxCopies: 2, effect: "При размещении выберите свою карту — она получает +2 к Силе." },
            { id: "k5", name: "Арбалетчик", type: "gray", line: "right", power: 6, influence: 5, maxCopies: 3, effect: "При размещении наносит 1 урон любой карте противника." },
            { id: "k6", name: "Требушет", type: "gray", line: "right", power: 6, influence: 4, maxCopies: 3, effect: "Дальнобойная осадная машина." },
            { id: "k7", name: "Разведчик", type: "purple", line: "right", power: 5, influence: 6, maxCopies: 2, effect: "При размещении сыграйте верхнюю карту из своей колоды." },
            { id: "k8", name: "Падший Рыцарь", type: "purple", line: "any", power: 6, influence: 8, maxCopies: 1, effect: "При размещении заберите любую карту противника в свою руку." },
            { id: "k9", name: "Рыцарь Эливан", type: "purple", line: "any", power: 12, influence: 8, maxCopies: 1, effect: "Легендарный рыцарь." },
            { id: "k10", name: "Отто Фон Гаус", type: "gold", line: "any", power: 15, influence: 12, maxCopies: 1, effect: "Мощный герой." },
            { id: "k11", name: "Братья Стали", type: "purple", line: "right", power: 5, influence: 4, maxCopies: 2, effect: "При размещении рядом с картой Братья Стали увеличивает силу этих двух карт на +2." },
            { id: "k12", name: "Опытный лучник", type: "purple", line: "right", power: 5, influence: 6, maxCopies: 2, effect: "При размещении выберите карту противника и нанесите ей 3 урона." },
            { id: "k13", name: "Сир Грегори Траттен", type: "purple", line: "left", power: 12, influence: 8, maxCopies: 1, effect: "Легендарный рыцарь." },
            { id: "k14", name: "Карлос Аугуст", type: "purple", line: "any", power: 10, influence: 10, maxCopies: 1, effect: "Может нанести урон равный его силе любой карте противника 1 раз за игру." },
            { id: "k15", name: "Рыцарь Маркус Таристан", type: "gold", line: "any", power: 8, influence: 12, maxCopies: 1, effect: "При размещении нанесите 8 урона любой карте противника." },
            { id: "k16", name: "Королевский Шпион", type: "gold", line: "any", power: 5, influence: 12, maxCopies: 1, effect: "При размещении возьмите верхнюю карту из колоды противника и сыграйте ее." },
            { id: "k17", name: "Анна Штраус", type: "gold", line: "any", power: 3, influence: 12, maxCopies: 1, effect: "При размещении выберите карту со своего поля и дайте ей +7 к силе." },
            { id: "k18", name: "Король Аугуст Роззен", type: "gold", line: "any", power: 6, influence: 20, maxCopies: 1, effect: "При размещении в ряду карты с эффектом размещения активируют умения повторно." },
            { id: "k19", name: "Стена щитов", type: "gold", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "При размещении дает всем картам в ряду +4 к Силе." },
            { id: "k20", name: "Лекарь Салема", type: "gold", line: "any", power: 5, influence: 12, maxCopies: 1, effect: "При размещении возвращает на поле 1 карту из отбоя." },
            { id: "k21", name: "Архиепископ Сентор", type: "gold", line: "any", power: 1, influence: 12, maxCopies: 1, effect: "Один раз за игру может применить карту 'Покаяние господня'." },
            { id: "k22", name: "Покаяние Господня", type: "special", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "При использовании карта Архиепископ Сентор получает +10 силы." },
            { id: "k23", name: "Королевский рог", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "Дает всем картам на поле игрока +2 к Силе." },
            { id: "k24", name: "Яма с кольями", type: "special", line: "any", power: 0, influence: 4, maxCopies: 3, effect: "При размещении выберите карту противника, если она получит увеличение силы — нанесите ей 3 урона." },
            { id: "k25", name: "Чучело", type: "special", line: "any", power: 0, influence: 5, maxCopies: 3, effect: "При размещении верните любую карту со своего поля себе в руку." },
            { id: "k26", name: "Бомба", type: "special", line: "any", power: 0, influence: 5, maxCopies: 4, effect: "При размещении нанесите противнику 4 урона." }
        ]
    },

    blacklily: {
        id: 'blacklily',
        name: "Прислужники Черной Лилии",
        color: "#6a1b9a",
        emblem: "images/Прислужники Черной Лилии.png",
        leaders: [
            { id: "black_lily", name: "Черная Лиллия", effect: "Создайте 1 призрака. Максимум 3 раза можно использовать" },
            ( id: "black_lily", name: "Апокалипсис", effect: "Призовите одного из вестников (Голод, Смерть, Чума, Война) из колоды" },
            { id: "lady_giselle", name: "Леди Жизель", effect: "Восполняет заряд Чернокнижника" }
        ],
        cards: [
            { id: "b1", name: "Демон", type: "white", line: "right", power: 4, influence: 4, maxCopies: 3, effect: "Базовый демон." },
            { id: "b2", name: "Проклятый", type: "gray", line: "left", power: 6, influence: 6, maxCopies: 4, effect: "При размещении в одном ряду с другими Проклятыми каждый получает +2 к силе." },
            { id: "b3", name: "Голем", type: "gray", line: "right", power: 10, influence: 6, maxCopies: 2, effect: "Тяжёлый юнит." },
            { id: "b4", name: "Командир Армии Мёртвых", type: "purple", line: "any", power: 5, influence: 8, maxCopies: 1, effect: "При размещении призывает 1 Демона из колоды." },
            { id: "b5", name: "Падальщик", type: "white", line: "right", power: 2, influence: 2, maxCopies: 4, effect: "При уничтожении даёт +1 силу любому отряду на поле." },
            { id: "b6", name: "Темный Маг", type: "purple", line: "any", power: 3, influence: 6, maxCopies: 2, effect: "При размещении уничтожьте карту на своем поле." },
            { id: "b7", name: "Культист", type: "gray", line: "right", power: 5, influence: 5, maxCopies: 2, effect: "При размещении призывает Призрака." },
            { id: "b8", name: "Призрак", type: "white", line: "any", power: 1, influence: 2, maxCopies: 4, effect: "После уничтожения появляется в любом ряду противника." },
            { id: "b9", name: "Ангел Смерти", type: "purple", line: "left", power: 4, influence: 6, maxCopies: 2, effect: "После смерти даёт +1 заряд Чернокнижнику." },
            { id: "b10", name: "Черная Лиллия", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Лидер. Создаёт Падальщиков." },
            { id: "b11", name: "Чернокнижник", type: "purple", line: "any", power: 3, influence: 8, maxCopies: 2, effect: "Имеет 1 заряд. Может уничтожить карту рядом и увеличить свою силу." },
            { id: "b12", name: "Смерть", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b13", name: "Голод", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b14", name: "Чума", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b15", name: "Война", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b16", name: "Апокалипсис", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "Уничтожает любую карту противника." },
            { id: "b17", name: "Призыв мертвых", type: "special", line: "any", power: 0, influence: 8, maxCopies: 1, effect: "Меняет карту на вашем поле на Ангела Смерти." },
            { id: "b18", name: "Призыватель", type: "purple", line: "any", power: 4, influence: 8, maxCopies: 2, effect: "Призовите любую карту из отбоя." }
        ]
    },

    dryads: {
        id: 'dryads',
        name: "Дриады Леса Нидолион",
        color: "#2e7d32",
        emblem: "images/Дриады леса Нидолион.png",
        leaders: [
            { id: "eliana_princess", name: "Принцесса Элиана", effect: "Переместите любую карту в другой ряд" },
            { id: "eliana_princess", name: "Принцесса Элиана", effect: "Ваши лучники наносят по 1 урону выбранной карте противника" },
            { id: "eliana_warrior", name: "Элиана Воительница", effect: "Сыграйте ловушку, если она сыграла, нанесите этой карте еще 4 урона" }
        ],
        cards: [
            { id: "d1", name: "Лучник Леса Нидолион", type: "white", line: "any", power: 4, influence: 4, maxCopies: 4, effect: "При размещении наносит 1 урон. При перемещении +1 сила." },
            { id: "d2", name: "Дриада Леса Нидолион", type: "white", line: "any", power: 4, influence: 4, maxCopies: 4, effect: "Когда увеличивает силу — перемещает любой отряд в другой ряд." },
            { id: "d3", name: "Хранитель Леса", type: "gray", line: "any", power: 6, influence: 6, maxCopies: 2, effect: "Расходует заряд (3) для перемещения одной карты в другой ряд." },
            { id: "d4", name: "Древо Мира", type: "purple", line: "any", power: 4, influence: 8, maxCopies: 2, effect: "При размещении перемещает 2 карты на своём поле в другой ряд." },
            { id: "d5", name: "Дети Леса", type: "gray", line: "any", power: 4, influence: 6, maxCopies: 2, effect: "Если в ряду 2 Дитя Леса — каждый получает +4 к силе." },
            { id: "d6", name: "Целитель", type: "purple", line: "any", power: 4, influence: 8, maxCopies: 3, effect: "При размещении все карты в ряду получают +1 к силе." },
            { id: "d7", name: "Дриада Воительница", type: "purple", line: "any", power: 6, influence: 8, maxCopies: 2, effect: "Получает +1 к силе если карта из ряда перешла в другой." },
            { id: "d8", name: "Элиона", type: "gold", line: "any", power: 4, influence: 12, maxCopies: 1, effect: "Если с Элионой Лучники Долины — +2 силы за каждую уничтоженную карту противника." },
            { id: "d9", name: "Повелительница Дриад Элиана", type: "gold", line: "any", power: 8, influence: 15, maxCopies: 1, effect: "Лидер." },
            { id: "d10", name: "Лучники Долины", type: "purple", line: "any", power: 5, influence: 8, maxCopies: 4, effect: "При перемещении наносит 2 урона любой карте противника." },
            { id: "d11", name: "Ниолина Прекрасная", type: "purple", line: "right", power: 8, influence: 8, maxCopies: 1, effect: "При размещении дает +3 силы карте слева и +3 силы карте справа." },
            { id: "d12", name: "Древо жизни Нидолиона", type: "gold", line: "left", power: 5, influence: 12, maxCopies: 1, effect: "Пока Древо жизни на поле, карты в этом ряду игнорируют урон." },
            { id: "d13", name: "Агнес дитя леса", type: "gold", line: "right", power: 2, influence: 12, maxCopies: 1, effect: "При размещении все Дети Леса получают +4 к силе." },
            { id: "d14", name: "Саллия из Нидолиона", type: "gold", line: "any", power: 3, influence: 12, maxCopies: 1, effect: "Если Саллия в руке, +2 к силе за каждую сыгранную ловушку." },
            { id: "d15", name: "Ловушка", type: "special", line: "any", power: 0, influence: 4, maxCopies: 4, effect: "Если карта противника получила силу — нанесите ей 3 урона." },
            { id: "d16", name: "Яма с кольями", type: "special", line: "any", power: 0, influence: 4, maxCopies: 3, effect: "При размещении выберите карту противника, если она получит увеличение силы — нанесите ей 3 урона." }
        ]
    },

    wizards: {
        id: 'wizards',
        name: "Орден Чародеев",
        color: "#7b1fa2",
        emblem: "images/Орден Чародеев.png",
        leaders: [
            { id: "magnussen", name: "Чародей Магнуссен", effect: "Верните 1 карту из отбоя в руку" },
            { id: "magnussen", name: "Чародей Кристофф", effect: "Копирует умение лидера противника" },
            { id: "christoff", name: "Чародей Алексиос", effect: "Посмотрите 3 верхние карты колоды противника и возьмите одну себе в руку" }
        ],
        cards: [
            { id: "w1", name: "Адепт Ордена Чародеев", type: "white", line: "left", power: 2, influence: 2, maxCopies: 3, effect: "Базовый маг." },
            { id: "w2", name: "Адепт Школы Огня", type: "gray", line: "left", power: 5, influence: 4, maxCopies: 2, effect: "При размещении наносит 1 урон любой карте противника." },
            { id: "w3", name: "Чародеи Силы Света", type: "gray", line: "left", power: 4, influence: 5, maxCopies: 2, effect: "При размещении сыграйте Эликсир жизни из колоды." },
            { id: "w4", name: "Эликсир Жизни", type: "special", line: "any", power: 0, influence: 6, maxCopies: 3, effect: "При размещении даёт +3 силы выбранной карте." },
            { id: "w5", name: "Магистр Ордена", type: "purple", line: "right", power: 6, influence: 8, maxCopies: 2, effect: "Если увеличивают здоровье — наносит 1 урон противнику." },
            { id: "w6", name: "Некромант", type: "purple", line: "any", power: 2, influence: 8, maxCopies: 1, effect: "При размещении возьмите 1 карту из отбоя и сразу разыграйте её." },
            { id: "w7", name: "Советник Короля", type: "purple", line: "any", power: 3, influence: 6, maxCopies: 3, effect: "При размещении заберите карту с поля противника на своё поле." },
            { id: "w8", name: "Мастер Шпионажа", type: "purple", line: "any", power: 6, influence: 6, maxCopies: 2, effect: "При размещении на поле противника посмотрите 3 его карты из руки." },
            { id: "w9", name: "Чародей Алексиос", type: "gold", line: "any", power: 5, influence: 15, maxCopies: 1, effect: "Когда противник усиливает карту — Чародей Алексиос тоже усиливается." },
            { id: "w10", name: "Чародей Кристофф", type: "gold", line: "any", power: 10, influence: 15, maxCopies: 1, effect: "После уничтожения появляется на поле со силой 5." },
            { id: "w11", name: "Арториус Вандевер", type: "purple", line: "left", power: 8, influence: 8, maxCopies: 1, effect: "При размещении выберите карту на своем поле и разыграйте ее размещение еще раз." },
            { id: "w12", name: "Порошок Ангилеи", type: "special", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "При размещении выберете 3 карты на своем поле и увеличьте их силу на +4." },
            { id: "w13", name: "Инквизиция", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "При размещении уничтожает любую карту. Если ваша — сыграйте Индульгенция." },
            { id: "w14", name: "Индульгенция", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "При размещении выберите карту из отбоя, верните на поле и дайте +6 к силе." },
            { id: "w15", name: "Кот в мешке", type: "gold", line: "any", power: 1, influence: 12, maxCopies: 1, effect: "При размещении Сила, броня и Здоровье будут выбраны случайным образом." },
            { id: "w16", name: "Гюсто", type: "gold", line: "any", power: 10, influence: 12, maxCopies: 1, effect: "Если не сыграли эту карту, то в начале 3 раунда она выйдет автоматически." },
            { id: "w17", name: "Чародей Магнуссен", type: "gold", line: "any", power: 5, influence: 20, maxCopies: 1, effect: "Остаётся на поле до конца игры." },
            { id: "w18", name: "Альмерия Франкен", type: "gold", line: "any", power: 4, influence: 12, maxCopies: 1, effect: "Пока в руке, после каждого хода противника увеличивает силу на +1." },
            { id: "w19", name: "Шайа Ванбюрен", type: "gold", line: "any", power: 8, influence: 12, maxCopies: 1, effect: "При размещении верните из отбоя в руку одну карту." }
        ]
    }
};

function getFactionCards(factionId) {
    const faction = FACTIONS[factionId];
    if (!faction) return [];
    return [...faction.cards, ...NEUTRAL_CARDS];
}

function getFactionLeaders(factionId) {
    return FACTIONS[factionId]?.leaders || [];
}

function getFactionLeader(factionId, leaderId = null) {
    const leaders = getFactionLeaders(factionId);
    if (!leaders.length) return null;
    if (leaderId) return leaders.find(l => l.id === leaderId) || leaders[0];
    return leaders[0];
}
