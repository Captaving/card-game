# 🚀 LILY WARS — Инструкция по деплою и загрузке на GitHub (v0.9)

## Текущая структура проекта (рекомендуемая)

```
lily-wars/
├── client/                 # Готовый клиент (Telegram Mini App)
│   ├── index.html
│   ├── js/
│   │   ├── config.js
│   │   ├── game.js         # Полноценная механика vs бот
│   │   ├── deckbuilder.js
│   │   └── bot.js
│   ├── css/
│   │   └── style.css
│   ├── assets/
│   │   └── factions/       # Сжатые логотипы (4 шт.)
│   └── README.md
├── server/                 # WebSocket сервер (для будущего онлайна)
│   └── server.js
├── DEPLOY.md
└── README.md               # Описание игры
```

## Шаг 1: Загрузка на GitHub (самый важный)

### Вариант A — Через GitHub Desktop / VS Code (рекомендую)

1. Скачай архив `lily-wars-client-ready.zip` (или папку `client/` из артефактов)
2. Распакуй
3. В своём репозитории на GitHub:
   - Создай новую ветку `feature/v0.9-game-mechanics`
   - Замени/добавь файлы из папки `client/` в корень репозитория (или в папку `client/`)
4. Commit:
   ```bash
   git add .
   git commit -m "feat: Полноценная одиночная игра v0.9 + 4 фракции + механика боя"
   git push origin feature/v0.9-game-mechanics
   ```
5. Создай Pull Request в `main`

### Вариант B — Прямо из терминала

```bash
# 1. Клонируй свой репозиторий (если ещё не сделал)
git clone https://github.com/ТВОЙ_ЮЗЕР/ТВОЙ_РЕПО.git lily-wars
cd lily-wars

# 2. Скопируй готовые файлы (замени на свои пути)
cp -r /путь/к/artifacts/client/* ./

# 3. Загрузи
git add .
git commit -m "feat(v0.9): Полная механика игры против бота, 4 фракции, конструктор колод"
git push
```

## Шаг 2: Деплой на сервер (VPS)

### 1. Подготовка сервера (один раз)

```bash
ssh root@ТВОЙ_IP

apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx
npm install -g pm2
```

### 2. Загрузка файлов

```bash
mkdir -p /var/www/lily-wars
cd /var/www/lily-wars

# Вариант A: git clone (лучше всего)
git clone https://github.com/ТВОЙ_ЮЗЕР/ТВОЙ_РЕПО.git .

# Вариант B: scp с локального компьютера
scp -r ./client/* root@ТВОЙ_IP:/var/www/lily-wars/client/
```

### 3. Настройка Nginx

```bash
nano /etc/nginx/sites-available/lily-wars
```

Вставь:

```nginx
server {
    listen 80;
    server_name ТВОЙ_ДОМЕН.com;

    root /var/www/lily-wars/client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Для будущего WebSocket (онлайн)
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Активируй:
```bash
ln -s /etc/nginx/sites-available/lily-wars /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

### 4. SSL (HTTPS — обязательно для Telegram)

```bash
certbot --nginx -d ТВОЙ_ДОМЕН.com
```

### 5. Запуск (пока только фронтенд)

Пока сервер не нужен (онлайн в разработке). Просто статические файлы.

```bash
# Для теста
cd /var/www/lily-wars/client
python3 -m http.server 8080
```

## Шаг 3: Настройка Telegram Mini App

1. Открой [@BotFather](https://t.me/botfather)
2. `/mybots` → выбери бота → **Bot Settings** → **Menu Button** → **Configure**
3. URL: `https://ТВОЙ_ДОМЕН.com`
4. Текст кнопки: `🌸 Играть в Lily Wars`

Готово! При нажатии на кнопку в боте откроется твоя игра.

## Частые проблемы

- **Картинки не грузятся** → Проверь пути `assets/factions/`
- **JS ошибки** → Открой DevTools (F12) → Console
- **Telegram не открывает** → Должен быть **HTTPS** + домен
- **Хочешь обновить** → Просто `git pull` на сервере и перезапусти nginx

---

**Текущая версия v0.9** полностью playable в одиночном режиме против бота.

Онлайн-мультиплеер и анимации — в следующих обновлениях.

Удачи с деплоем! Если что-то не получается — пиши.
