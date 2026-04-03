# ⚔️ Карточная Битва - Telegram Mini App

Карточная стратегическая игра для Telegram с возможностью игры онлайн и против бота.

## 🎮 Особенности

- **4 уникальные фракции** с собственными картами и способностями
- **Конструктор колод** - собери свою уникальную колоду из 25 карт
- **Онлайн мультиплеер** - играй с друзьями или случайными соперниками
- **Игра против бота** - тренируйся перед реальными сражениями
- **Интеграция с Telegram** - использует Telegram WebApp API

## 📋 Требования

- Node.js 16+ 
- npm или yarn
- Аккаунт Telegram и созданный бот

## 🚀 Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск сервера

```bash
# Продакшен режим
npm start

# Режим разработки (с авто-перезагрузкой)
npm run dev
```

Сервер запустится на порту `3000` (или `PORT` из переменных окружения).

### 3. Настройка Telegram бота

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. В настройках бота укажите Web App URL: `https://your-domain.com/game.html`
4. Добавьте кнопку меню для запуска Mini App

### 4. Развёртывание

#### Вариант A: VPS/Выделенный сервер

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd telegram-card-battle

# Установите зависимости
npm install --production

# Запустите через PM2 (рекомендуется)
npm install -g pm2
pm2 start server.js --name card-battle
pm2 save
pm2 startup
```

#### Вариант B: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Вариант C: Heroku/Render/Railway

1. Подключите репозиторий к платформе
2. Укажите build command: `npm install`
3. Укажите start command: `npm start`
4. Добавьте переменную окружения `PORT` (если требуется)

## 📁 Структура проекта

```
├── index.html          # Главная страница (старое меню)
├── game.html           # Главное меню игры
├── multiplayer.html    # Поиск онлайн матча
├── battle.html         # Игра против бота
├── battle-online.html  # Онлайн битва
├── deckbuilder.html    # Конструктор колоды
├── saved-decks.html    # Сохранённые колоды
├── config.js           # Конфигурация игры (карты, фракции)
├── firebase.js         # Firebase конфигурация (опционально)
├── server.js           # Socket.IO сервер для мультиплеера
└── package.json        # Зависимости Node.js
```

## 🎴 Фракции

1. **🔵 Рыцари Цветка Лилии** - сбалансированная фракция с упором на защиту
2. **🟣 Орден Чародеев** - магические комбинации и контроль поля
3. **⚫ Прислужники Черной Лилии** - агрессивная тактика, эффект смерти
4. **🟢 Дриады леса Нидолион** - синергия и восстановление

## 🕹️ Как играть

### Цель игры
Победить в 2 из 3 раундов, набрав больше очков силы, чем противник.

### Правила
1. Каждый игрок получает 10 карт в начале раунда
2. Карты размещаются в левый или правый ряд
3. Сумма силы карт в рядах = очки раунда
4. Используйте способности лидеров один раз за игру
5. PASS пропускает ход, но завершает раунд когда оба игрока пасуют

### Типы карт
- **⚪ Белые** - базовые карты (1-3 влияния)
- **⚫ Серые** - обычные карты (4-5 влияний)
- **🟣 Фиолетовые** - редкие карты со способностями
- **🟡 Золотые** - легендарные карты с мощными эффектами
- **🔴 Особые** - одноразовые эффекты (ловушки, бомбы)

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `3000` |
| `FIREBASE_API_KEY` | Firebase API ключ | (не обязательно) |

### Настройка сервера

В `server.js` можно изменить:
- CORS настройки (по умолчанию `*`)
- Логику матчмейкинга
- Обработку событий Socket.IO

## 🌐 API Сервера

### События Socket.IO

**Клиент → Сервер:**
- `find-match` - поиск соперника
- `cancel-matchmaking` - отмена поиска
- `create-room` - создать комнату
- `join-room` - войти в комнату
- `play-card` - сыграть карту
- `pass-turn` - пропустить ход
- `use-leader` - использовать лидера
- `leave-room` - выйти из комнаты
- `game-end` - завершить игру

**Сервер → Клиент:**
- `match-found` - соперник найден
- `matchmaking-started` - поиск начат
- `room-created` - комната создана
- `game-start` - игра началась
- `opponent-move` - ход противника
- `opponent-pass` - противник пасует
- `opponent-leader` - противник использовал лидера
- `opponent-disconnected` - противник отключился
- `game-result` - результат игры
- `error` - ошибка

## 📱 Интеграция с Telegram

### Инициализация WebApp

```javascript
const tg = window.Telegram.WebApp;
tg.expand();  // Расширить на весь экран
tg.ready();   // Готово к работе
```

### Использование данных пользователя

```javascript
const user = tg.initDataUnsafe?.user;
if (user) {
  console.log(user.first_name);
  console.log(user.id);
}
```

### Тактильная отдача

```javascript
if (tg.HapticFeedback) {
  tg.HapticFeedback.impactOccurred('light');
  tg.HapticFeedback.notificationOccurred('success');
}
```

### Темизация

```javascript
const theme = tg.themeParams;
console.log(theme.bg_color);      // Цвет фона
console.log(theme.button_color);  // Цвет кнопок
```

## 🔒 Безопасность

### Валидация initData

Для проверки подлинности данных от Telegram используйте серверную валидацию:

```javascript
const crypto = require('crypto');

function validateInitData(initData, botToken) {
  const arr = new URLSearchParams(initData);
  const hash = arr.get('hash');
  arr.delete('hash');
  
  const dataCheckString = Array.from(arr.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
    
  const secret = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
    
  const calculatedHash = crypto.createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');
    
  return calculatedHash === hash;
}
```

## 🐛 Известные проблемы

- [ ] Firebase не подключён в HTML страницах
- [ ] Нет серверной валидации initData
- [ ] Хардкод цветов вместо themeParams
- [ ] Отсутствует документация по развёртыванию

## 📝 TODO

- [ ] Добавить серверную валидацию initData
- [ ] Интегрировать Firebase для сохранения прогресса
- [ ] Использовать Telegram ThemeParams для темизации
- [ ] Добавить таблицу лидеров
- [ ] Реализовать систему достижений
- [ ] Добавить звуки и анимации
- [ ] Оптимизировать для десктопной версии Telegram

## 📄 Лицензия

MIT License - свободное использование с указанием авторства.

## 👥 Контакты

По вопросам и предложениям: [ваш контакт]

---

**Приятной игры! 🎮**
