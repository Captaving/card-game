# 🌸 Lily Wars — Коллекционная карточная игра (ККИ)

**Lily Wars** — это браузерная ККИ с мультиплеером через WebSocket, готовящаяся к запуску как **Telegram Mini App**.

Текущая версия: **0.9** (демо мультиплеера + редактор колод + бот + 1 фракция)

## ✨ Возможности (на данный момент)

- Полноценный **редактор колод** с лимитами (25 карт, 170 влияния)
- **Игра с ботом** (заглушка с простой симуляцией)
- **Онлайн мультиплеер** (очередь 1v1, комнаты, синхронизация ходов, атака, сдача)
- Telegram Mini App поддержка (WebApp API)
- Полностью готово к деплою на VPS (nginx + PM2 + SSL)

## 📁 Структура проекта

```
lily-wars/
├── server/                 # Node.js + WebSocket сервер
│   ├── package.json
│   └── server.js           # Matchmaking, комнаты, broadcast, демо-логика
├── client/                 # Frontend (статические файлы)
│   ├── index.html          # Все экраны: меню, колоды, билдер, игра
│   ├── css/style.css
│   └── js/
│       ├── config.js       # Фракции, карты, настройки
│       ├── game.js         # Логика меню, WebSocket клиент, UI игры
│       ├── bot.js          # Простой бот
│       └── deckbuilder.js  # Редактор колод
├── README.md
└── DEPLOY.md               # Полный гайд по деплою на сервер
```

## 🚀 Быстрый старт (локально)

1. Клонируйте репозиторий:
   ```bash
   git clone <ваш-репо>
   cd lily-wars
   ```

2. Установите зависимости сервера:
   ```bash
   cd server
   npm install
   ```

3. Запустите сервер (он отдаёт клиент):
   ```bash
   node server.js
   # или npm start
   ```

4. Откройте в браузере: **http://localhost:8080**

   - Создайте колоду → Сохраните
   - Попробуйте "Игра с ботом"
   - Для мультиплеера: откройте **две вкладки** → "Игра онлайн" в обеих

## 🧪 Тестирование мультиплеера

1. Запустите сервер.
2. Откройте `http://localhost:8080` в **двух разных вкладках/браузерах**.
3. В обеих нажмите **⚔️ Игра онлайн**.
4. Должно найти матч, начаться игра.
5. Используйте кнопки внизу экрана игры:
   - "Сыграть карту (демо)"
   - "Закончить ход"
   - "Атаковать (демо)" — снижает HP противника
   - "Сдаться"

Здоровье, ходы и действия синхронизируются между игроками в реальном времени.

## 📦 Публикация на GitHub

### Вариант 1: Новый репозиторий (рекомендуется)

1. Зайдите на [github.com](https://github.com) → **New repository**
2. Название: `lily-wars` (или любое)
3. **Public** (или Private)
4. **НЕ** инициализируйте с README (мы загрузим свои файлы)
5. Нажмите **Create repository**

### Вариант 2: Через терминал (после клонирования)

```bash
cd lily-wars
git init
git add .
git commit -m "Initial commit: Lily Wars 0.9 - full multiplayer skeleton + deckbuilder + TG MiniApp ready"
git branch -M main

# Добавьте remote (скопируйте URL с GitHub)
git remote add origin https://github.com/ВАШ_ЮЗЕР/lily-wars.git

git push -u origin main
```

Готово! Теперь у вас есть чистый репозиторий.

## 🖥️ Деплой на сервер (VPS)

Полный пошаговый гайд находится в файле **[DEPLOY.md](./DEPLOY.md)**.

Кратко:

```bash
# На сервере (Ubuntu 22.04+)
ssh root@ВАШ_IP

# Установка (Node 20, PM2, nginx, certbot)
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx
npm install -g pm2

# Клонирование
cd /var/www
git clone https://github.com/ВАШ_ЮЗЕР/lily-wars.git
cd lily-wars/server
npm install

# Настройка nginx + SSL (см. DEPLOY.md)
# Запуск
pm2 start server.js --name lily-wars
pm2 save && pm2 startup
```

После деплоя у вас будет:
- `https://ваш-домен.com` — Mini App
- WebSocket: `wss://ваш-домен.com/ws`

## 🤖 Настройка Telegram Mini App

1. Откройте [@BotFather](https://t.me/BotFather)
2. `/newbot` — создайте бота (если ещё нет)
3. `/mybots` → выберите бота → **Bot Settings** → **Menu Button** → **Configure**
   - URL: `https://ваш-домен.com`
   - Текст кнопки: `🌸 Играть в Lily Wars`
4. Или командой:
   ```
   /setmenubutton
   ```
   Выберите бота → введите URL → текст кнопки.

Готово! Пользователи смогут запускать игру прямо из Telegram.

## 🔄 Обновление кода

```bash
cd /var/www/lily-wars
git pull origin main
pm2 restart lily-wars
```

Или создайте `update.sh` (см. DEPLOY.md).

## 🛠️ Что дальше (план развития)

После тестов вы планируете добавить:
- Полноценную механику карт, руки, поля боя (ряды left/right)
- Анимации и красивый UI игры
- Другие фракции и карты
- Рейтинг, профили игроков
- Магазин / открытие пакетов
- ... (ваш список)

## 📄 Лицензия

MIT (или ваша)

---

**Удачи с Lily Wars!** 🌸 Если нужны доработки — пиши, после тестов добавим следующую функциональность.
