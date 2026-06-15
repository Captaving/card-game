# 🚀 LILY WARS — Полный гайд по деплою на сервер + Telegram Mini App

## Актуальная структура проекта

```
/var/www/lily-wars/
├── server/
│   ├── package.json
│   └── server.js          ← WebSocket + Express (отдаёт клиент)
└── client/
    ├── index.html         ← Точка входа Mini App (все экраны внутри)
    ├── css/
    │   └── style.css
    └── js/
        ├── config.js
        ├── game.js        ← WebSocket клиент + логика
        ├── bot.js
        └── deckbuilder.js
```

---

## ШАГ 1 — Подключение к серверу (VPS)

```bash
ssh root@ВАШ_IP
```

Рекомендуется Ubuntu 22.04 / 24.04.

---

## ШАГ 2 — Установка зависимостей

```bash
apt update && apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v   # должно быть v20.x
npm -v

# PM2 + nginx + certbot
npm install -g pm2
apt install -y nginx certbot python3-certbot-nginx
```

---

## ШАГ 3 — Клонирование проекта с GitHub

```bash
mkdir -p /var/www
cd /var/www

git clone https://github.com/ВАШ_ЮЗЕР/lily-wars.git
cd lily-wars

# Установка зависимостей сервера
cd server
npm install
cd ..
```

---

## ШАГ 4 — Настройка nginx (HTTP + WebSocket proxy)

```bash
nano /etc/nginx/sites-available/lily-wars
```

Вставьте:

```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН.com;   # ← замените!

    root /var/www/lily-wars/client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # WebSocket прокси на Node
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

Активируйте:

```bash
ln -s /etc/nginx/sites-available/lily-wars /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
```

---

## ШАГ 5 — SSL (HTTPS / WSS) — обязательно для Telegram

```bash
certbot --nginx -d ВАШ_ДОМЕН.com
```

- Введите email
- Согласитесь с условиями
- Certbot сам обновит конфиг nginx под HTTPS + добавит редирект

Включите автообновление:

```bash
systemctl enable certbot.timer
```

Теперь сайт доступен по `https://ВАШ_ДОМЕН.com` и WebSocket по `wss://ВАШ_ДОМЕН.com/ws`

---

## ШАГ 6 — Запуск сервера через PM2

```bash
cd /var/www/lily-wars/server

pm2 start server.js --name lily-wars

pm2 save
pm2 startup
# Выполните команду, которую выведет PM2 (обычно что-то вроде `sudo env PATH=...`)
```

Полезные команды:

```bash
pm2 status
pm2 logs lily-wars --lines 100
pm2 restart lily-wars
pm2 stop lily-wars
```

---

## ШАГ 7 — Настройка Telegram Mini App

1. Откройте [@BotFather](https://t.me/BotFather)
2. Если бота нет — `/newbot`
3. `/mybots` → выберите вашего бота
4. **Bot Settings** → **Menu Button** → **Configure menu button**
   - **URL**: `https://ВАШ_ДОМЕН.com`
   - **Текст кнопки**: `🌸 Играть в Lily Wars`

Или одной командой:

```
/setmenubutton
```
→ выберите бота → введите URL → введите текст кнопки.

Готово! При нажатии на кнопку меню в боте откроется ваша игра.

---

## ШАГ 8 — Проверка работоспособности

```bash
# Статус
systemctl status nginx
pm2 status

# Логи сервера
pm2 logs lily-wars --lines 50

# Проверка порта
ss -tlnp | grep 8080

# Проверка WebSocket (с локальной машины)
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     -H "Sec-WebSocket-Version: 13" \
     https://ВАШ_ДОМЕН.com/ws
```

Откройте `https://ВАШ_ДОМЕН.com` в браузере — должна загрузиться игра.

---

## Частые проблемы и решения

| Проблема                        | Решение |
|--------------------------------|--------|
| WebSocket не подключается      | Убедитесь, что URL в браузере `https://`, а не `http://`. Проверьте nginx location `/ws` |
| 502 Bad Gateway                | `pm2 status` — сервер упал? `pm2 logs` |
| Сертификат не выдается         | Домен должен иметь A-запись на IP сервера. Подождите 5–10 мин после изменения DNS |
| PM2 не стартует после reboot   | Выполните `pm2 startup` и скопируйте/выполните выданную команду |
| Telegram не открывает Mini App | URL должен быть **HTTPS**. Проверьте в @BotFather |

---

## Обновление после пуша в GitHub

```bash
cd /var/www/lily-wars
git pull origin main
pm2 restart lily-wars
```

Рекомендуется создать скрипт:

```bash
nano /var/www/lily-wars/update.sh
```

```bash
#!/bin/bash
cd /var/www/lily-wars
git pull origin main
pm2 restart lily-wars
echo "✅ Lily Wars обновлён"
```

```bash
chmod +x /var/www/lily-wars/update.sh
```

---

## Готово!

Теперь у вас полноценный **Telegram Mini App** с рабочим мультиплеером ККИ.

После ваших тестов напишите, что нужно добавить дальше (полная механика боя, новые фракции, анимации и т.д.).

Удачи! 🌸
