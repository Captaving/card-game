// Game Configuration
const GAME_CONFIG = {
  maxDeckSize: 25,
  maxInfluence: 170,
  startingHand: 8,
  maxMulligan: 3
};

const FACTIONS = {
  knights: {
    name: "Рыцари Лилии",
    color: "#3498db",
    leader: { id: "leader1", name: "Командир Лилии", power: 8, influence: 0 },
    cards: [
      {id: "k1", name: "Пехотинец", power: 3, influence: 2, row: "left", effect: "Базовый юнит"},
      {id: "k2", name: "Рыцарь", power: 5, influence: 4, row: "left", effect: "+2 силы в ряду"},
      {id: "k3", name: "Арбалетчик", power: 4, influence: 3, row: "right", effect: "Дальний бой"},
      {id: "k4", name: "Воин Света", power: 7, influence: 6, row: "left", effect: "Исцеление союзников"},
      {id: "k5", name: "Щитоносец", power: 2, influence: 3, row: "left", effect: "Блок урона"}
    ]
  }
  // Add more factions later
};

let savedDecks = JSON.parse(localStorage.getItem('lilyDecks')) || [];

console.log("✅ Config & Data loaded");