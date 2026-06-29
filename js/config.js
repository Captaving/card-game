// Lily Wars - Полная база карт (все карты из Excel)
const GAME_CONFIG = {
    maxDeckSize: 25,
    maxInfluence: 170,
    startingHand: 6,
    maxMulligan: 2
};

const FACTIONS = {
    knights: {
        id: 'knights',
        name: "Рыцари Цветка Лилии",
        color: "#3498db",
        emblem: "images/Рыцари Цветка Лилии.png",
        leaders: [
            { id: "king_brave", name: "Король Аугуст Роззен Смелый", power: 6, influence: 20, effect: "При размещении в ряду карты с эффектом размещения активируют умения повторно" },
            { id: "king_courage", name: "Король Аугуст Роззен Отважный", power: 7, influence: 20, effect: "Отменяет умение лидера фракции противника" },
            { id: "king_victory", name: "Король Аугуст Роззен Победитель", power: 8, influence: 22, effect: "Дает всем вашим картам на поле +1 к силе" }
        ],
        cards: [
            // Белые / Базовые
            { id: "k1", name: "Пехотинец", type: "white", line: "left", power: 2, influence: 2, maxCopies: 3, effect: "Базовый воин." },
            // Серые
            { id: "k2", name: "Рыцарь Ордена", type: "gray", line: "left", power: 5, influence: 4, maxCopies: 2, effect: "Стандартный рыцарь." },
            { id: "k3", name: "Знаменосец", type: "gray", line: "left", power: 5, influence: 4, maxCopies: 2, effect: "Воодушевляет союзников." },
            { id: "k11", name: "Требушет", type: "gray", line: "right", power: 6, influence: 4, maxCopies: 3, effect: "Дальнобойная осадная машина." },
            { id: "k12", name: "Арбалетчик", type: "gray", line: "right", power: 6, influence: 5, maxCopies: 3, effect: "При размещении наносит 1 урон любой карте противника." },
            // Фиолетовые
            { id: "k4", name: "Воин Света", type: "purple", line: "left", power: 6, influence: 5, maxCopies: 2, effect: "При размещении выберите свою карту — она получает +2 к Силе." },
            { id: "k7", name: "Разведчик", type: "purple", line: "right", power: 5, influence: 6, maxCopies: 2, effect: "При размещении сыграйте верхнюю карту из своей колоды." },
            { id: "k8", name: "Падший Рыцарь", type: "purple", line: "any", power: 6, influence: 8, maxCopies: 1, effect: "При размещении заберите любую карту противника в свою руку." },
            { id: "k9", name: "Рыцарь Эливан", type: "purple", line: "any", power: 12, influence: 8, maxCopies: 1, effect: "Легендарный рыцарь высокой силы." },
            { id: "k13", name: "Братья Стали", type: "purple", line: "right", power: 5, influence: 4, maxCopies: 2, effect: "При размещении рядом с картой Братья Стали увеличивает силу этих двух карт на +2." },
            { id: "k14", name: "Опытный лучник", type: "purple", line: "right", power: 5, influence: 6, maxCopies: 2, effect: "При размещении выберите карту противника и нанесите ей 3 урона." },
            // Золотые / Легендарные
            { id: "k10", name: "Отто Фон Гаус", type: "gold", line: "any", power: 15, influence: 12, maxCopies: 1, effect: "Мощный герой." },
            { id: "k15", name: "Рыцарь Маркус Таристан", type: "gold", line: "any", power: 8, influence: 12, maxCopies: 1, effect: "При размещении нанесите 8 урона любой карте противника." },
            { id: "k16", name: "Королевский Шпион", type: "gold", line: "any", power: 5, influence: 12, maxCopies: 1, effect: "При размещении возьмите верхнюю карту из колоды противника и сыграйте ее." },
            { id: "k17", name: "Анна Штраус", type: "gold", line: "any", power: 3, influence: 12, maxCopies: 1, effect: "При размещении выберите карту со своего поля и дайте ей +7 к силе." },
            { id: "k18", name: "Король Аугуст Роззен", type: "gold", line: "any", power: 6, influence: 20, maxCopies: 1, effect: "При размещении в ряду карты с эффектом размещения активируют умения повторно." },
            { id: "k19", name: "Стена щитов", type: "gold", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "При размещении дает всем картам в ряду +4 к Силе. (Уходит в отбой)" },
            { id: "k20", name: "Лекарь Салема", type: "gold", line: "any", power: 5, influence: 12, maxCopies: 1, effect: "При размещении возвращает на поле 1 карту из отбоя." },
            { id: "k21", name: "Архиепископ Сентор", type: "gold", line: "any", power: 1, influence: 12, maxCopies: 1, effect: "Один раз за игру может применить карту 'Покаяние господня' если она есть в колоде." },
            { id: "k22", name: "Покаяние Господня", type: "special", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "При использовании карта Архиепископ Сентор получает +10 силы. (Уходит в отбой)" },
            { id: "k23", name: "Королевский рог", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "Дает всем картам на поле игрока +2 к Силе. (Уходит в отбой)" },
            { id: "k24", name: "Сир Грегори Траттен", type: "purple", line: "left", power: 12, influence: 8, maxCopies: 1, effect: "Легендарный рыцарь." },
            { id: "k25", name: "Карлос Аугуст", type: "purple", line: "any", power: 10, influence: 10, maxCopies: 1, effect: "Может нанести урон равный его силе любой карте противника 1 раз за игру." }
        ]
    },

    blacklily: {
        id: 'blacklily',
        name: "Прислужники Черной Лилии",
        color: "#4a148c",
        emblem: "images/Прислужники Черной Лилии.png",
        leaders: [
            { id: "black_lily", name: "Черная Лиллия", power: 8, influence: 10, effect: "При размещении создаёт рядом 2 карты Падальщика" },
            { id: "lady_giselle", name: "Леди Жизель", power: 6, influence: 12, effect: "Восполняет заряд Чернокнижника и усиливает Призраков" }
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
            { id: "b11", name: "Подношение Лилии", type: "special", line: "any", power: 0, influence: 8, maxCopies: 1, effect: "Если на поле есть Чернокнижник, уничтожьте любую свою карту и увеличьте силу Чернокнижника." },
            { id: "b12", name: "Смерть", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b13", name: "Голод", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b14", name: "Чума", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b15", name: "Война", type: "gold", line: "any", power: 8, influence: 10, maxCopies: 1, effect: "Если в ряду Война, Чума и Голод — призывает Апокалипсис." },
            { id: "b16", name: "Апокалипсис", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "Уничтожает любую карту противника. (Уходит в отбой)" },
            { id: "b17", name: "Призыв мертвых", type: "special", line: "any", power: 0, influence: 8, maxCopies: 1, effect: "Меняет карту на вашем поле на Ангела Смерти. (Уходит в отбой)" },
            { id: "b18", name: "Призыватель", type: "purple", line: "any", power: 4, influence: 8, maxCopies: 2, effect: "Призовите любую карту из отбоя. Если это призрак, восполните заряд у Чернокнижника." },
            { id: "b19", name: "Леди Жизель", type: "gold", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "Восполните заряд Чернокнижника." }
        ]
    },

    dryads: {
        id: 'dryads',
        name: "Дриады Леса Нидолион",
        color: "#2e7d32",
        emblem: "images/Дриады леса Нидолион.png",
        leaders: [
            { id: "eliana_princess", name: "Принцесса Элиана", power: 8, influence: 15, effect: "При размещении даёт возможность лидеру использовать свой эффект снова" },
            { id: "eliana_warrior", name: "Элиана Воительница", power: 9, influence: 16, effect: "Посмотрите 3 верхние карты колоды противника и возьмите одну себе в руку" }
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
            { id: "d9", name: "Повелительница Дриад Элиана", type: "gold", line: "any", power: 8, influence: 15, maxCopies: 1, effect: "Лидер. Повторный эффект лидера." },
            { id: "d10", name: "Лучники Долины", type: "purple", line: "any", power: 5, influence: 8, maxCopies: 4, effect: "При перемещении наносит 2 урона любой карте противника." },
            { id: "d11", name: "Разведчики Леса", type: "purple", line: "any", power: 3, influence: 5, maxCopies: 4, effect: "При размещении сыграйте карту Ловушка." },
            { id: "d12", name: "Древо жизни Нидолиона", type: "gold", line: "left", power: 5, influence: 12, maxCopies: 1, effect: "Пока Древо жизни на поле, карты в этом ряду игнорируют урон." },
            { id: "d13", name: "Агнес дитя леса", type: "gold", line: "right", power: 2, influence: 12, maxCopies: 1, effect: "При размещении все Дети Леса получают +4 к силе." },
            { id: "d14", name: "Саллия из Нидолиона", type: "gold", line: "any", power: 3, influence: 12, maxCopies: 1, effect: "Если Саллия в руке, +2 к силе за каждую сыгранную ловушку." },
            { id: "d15", name: "Путы ярости", type: "special", line: "any", power: 0, influence: 6, maxCopies: 4, effect: "Выберите карту противника, если она получит урон — Хранитель Леса +2 заряда." },
            { id: "d16", name: "Ниолина Прекрасная", type: "purple", line: "right", power: 8, influence: 8, maxCopies: 1, effect: "При размещении даёт +3 силы карте слева и +3 силы карте справа." }
        ]
    },

    wizards: {
        id: 'wizards',
        name: "Орден Чародеев",
        color: "#7b1fa2",
        emblem: "images/Орден Чародеев.png",
        leaders: [
            { id: "magnussen", name: "Чародей Магнуссен", power: 5, influence: 20, effect: "Эта карта остаётся на поле до окончания игры. В конце раунда не уходит в отбой" },
            { id: "christoff", name: "Чародей Кристофф", power: 10, influence: 18, effect: "После уничтожения появляется на поле со силой 5" }
        ],
        cards: [
            { id: "w1", name: "Адепт Ордена Чародеев", type: "white", line: "left", power: 2, influence: 2, maxCopies: 3, effect: "Базовый маг." },
            { id: "w2", name: "Адепт Школы Огня", type: "gray", line: "left", power: 5, influence: 4, maxCopies: 2, effect: "При размещении наносит 1 урон любой карте противника." },
            { id: "w3", name: "Чародеи Силы Света", type: "gray", line: "left", power: 4, influence: 5, maxCopies: 2, effect: "При размещении сыграйте Эликсир жизни из колоды." },
            { id: "w4", name: "Эликсир Жизни", type: "special", line: "any", power: 0, influence: 6, maxCopies: 3, effect: "При размещении даёт +3 силы выбранной карте. (Уходит в отбой)" },
            { id: "w5", name: "Магистр Ордена", type: "purple", line: "right", power: 6, influence: 8, maxCopies: 2, effect: "Если увеличивают здоровье — наносит 1 урон противнику." },
            { id: "w6", name: "Некромант", type: "purple", line: "any", power: 2, influence: 8, maxCopies: 1, effect: "При размещении возьмите 1 карту из отбоя и сразу разыграйте её." },
            { id: "w7", name: "Советник Короля", type: "purple", line: "any", power: 3, influence: 6, maxCopies: 3, effect: "При размещении заберите карту с поля противника на своё поле." },
            { id: "w8", name: "Мастер Шпионажа", type: "purple", line: "any", power: 6, influence: 6, maxCopies: 2, effect: "При размещении на поле противника посмотрите 3 его карты из руки." },
            { id: "w9", name: "Чародей Алексиос", type: "gold", line: "any", power: 5, influence: 15, maxCopies: 1, effect: "Когда противник усиливает карту — Чародей Алексиос тоже усиливается." },
            { id: "w10", name: "Чародей Кристофф", type: "gold", line: "any", power: 10, influence: 15, maxCopies: 1, effect: "После уничтожения появляется на поле со силой 5." },
            { id: "w11", name: "Магистр Ларгусс", type: "purple", line: "any", power: 10, influence: 8, maxCopies: 1, effect: "Нет особого эффекта." },
            { id: "w12", name: "Арториус Вандевер", type: "purple", line: "left", power: 8, influence: 8, maxCopies: 1, effect: "При размещении выберите карту на своем поле и разыграйте ее размещение еще раз." },
            { id: "w13", name: "Порошок Ангилеи", type: "special", line: "any", power: 0, influence: 10, maxCopies: 1, effect: "При размещении выберете 3 карты на своем поле и увеличьте их силу на +4." },
            { id: "w14", name: "Инквизиция", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "При размещении уничтожает любую карту. Если ваша — сыграйте Индульгенция." },
            { id: "w15", name: "Индульгенция", type: "special", line: "any", power: 0, influence: 12, maxCopies: 1, effect: "При размещении выберите карту из отбоя, верните на поле и дайте +6 к силе." },
            { id: "w16", name: "Кот в мешке", type: "gold", line: "any", power: 1, influence: 12, maxCopies: 1, effect: "При размещении Сила, броня и Здоровье будут выбраны случайным образом (1-14)." },
            { id: "w17", name: "Гюсто", type: "gold", line: "any", power: 10, influence: 12, maxCopies: 1, effect: "Если не сыграли эту карту, то в начале 3 раунда она выйдет автоматически." },
            { id: "w18", name: "Чародей Магнуссен", type: "gold", line: "any", power: 5, influence: 20, maxCopies: 1, effect: "Остаётся на поле до конца игры." },
            { id: "w19", name: "Альмерия Франкен", type: "gold", line: "any", power: 4, influence: 12, maxCopies: 1, effect: "Пока в руке, после каждого хода противника увеличивает силу на +1." },
            { id: "w20", name: "Шайа Ванбюрен", type: "gold", line: "any", power: 8, influence: 12, maxCopies: 1, effect: "При размещении верните из отбоя в руку одну карту." }
        ]
    }
};

function getFactionCards(factionId) {
    return FACTIONS[factionId]?.cards || [];
}

function getFactionLeaders(factionId) {
    return FACTIONS[factionId]?.leaders || [];
}

function getFactionLeader(factionId, leaderId = null) {
    const leaders = getFactionLeaders(factionId);
    if (leaderId) return leaders.find(l => l.id === leaderId) || leaders[0];
    return leaders[0] || null;
}

console.log("✅ Lily Wars — ВСЕ карты загружены (4 фракции, ~100+ уникальных карт)");