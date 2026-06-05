# 🚀 LILY WARS — Полный гайд по деплою на сервер

## Структура проекта на сервере
```
/var/www/lily-wars/
├── server/
│   ├── server.js
│   └── package.json
└── client/
    ├── index.html
    ├── js/
    │   ├── config.js
    │   ├── game.js
    │   └── bot.js
    └── css/
        └── style.css
```

---

## ШАГ 1 — Подключение к серверу

```bash
ssh root@ВАШ_IP
```

---

## ШАГ 2 — Установка зависимостей

```bash
# Обновить систему
apt update && apt upgrade -y

# Установить Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверить версии
node -v   # должно быть v20.x.x
npm -v

# Установить PM2 (менеджер процессов)
npm install -g pm2

# Установить nginx
apt install -y nginx

# Установить certbot для SSL
apt install -y certbot python3-certbot-nginx
```

---

## ШАГ 3 — Создание структуры папок

```bash
# Создать папку проекта
mkdir -p /var/www/lily-wars/server
mkdir -p /var/www/lily-wars/client/js
mkdir -p /var/www/lily-wars/client/css

# Перейти в папку
cd /var/www/lily-wars
```

---

## ШАГ 4 — Загрузка файлов с GitHub

```bash
# Вариант А: клонировать репозиторий
cd /var/www
git clone https://github.com/ВАШ_ЮЗЕР/ВАШ_РЕПО.git lily-wars

# Вариант Б: скопировать вручную через scp (с локального компа)
scp -r ./cardgame/* root@ВАШ_IP:/var/www/lily-wars/

# Вариант В: загрузить через nano (если файлы небольшие)
nano /var/www/lily-wars/server/server.js
# вставить содержимое, Ctrl+O сохранить, Ctrl+X выйти
```

---

## ШАГ 5 — Настройка сервера

```bash
cd /var/www/lily-wars/server
npm install

# Проверить что запускается
node server.js
# Должно появиться: Lily Wars server running on port 8080
# Ctrl+C чтобы остановить
```

---

## ШАГ 6 — Прописать адрес сервера в game.js

```bash
nano /var/www/lily-wars/client/js/game.js
```

Найти строку (она в самом начале файла):
```js
const SERVER_URL = 'wss://YOUR_SERVER_ADDRESS:8080';
```
Заменить на:
```js
const SERVER_URL = 'wss://ВАШ_ДОМЕН.com/ws';
```
Сохранить: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## ШАГ 7 — Настройка nginx

```bash
nano /etc/nginx/sites-available/lily-wars
```

Вставить следующий конфиг:
```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН.com;

    # Статические файлы клиента
    root /var/www/lily-wars/client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксировать WebSocket на Node.js
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

```bash
# Активировать сайт
ln -s /etc/nginx/sites-available/lily-wars /etc/nginx/sites-enabled/

# Удалить дефолтный сайт
rm /etc/nginx/sites-enabled/default

# Проверить конфиг
nginx -t

# Перезапустить nginx
systemctl restart nginx
```

---

## ШАГ 8 — SSL сертификат (HTTPS/WSS)

Telegram требует HTTPS для Mini App. Нужен домен.

```bash
# Получить сертификат (замените на ваш домен)
certbot --nginx -d ВАШ_ДОМЕН.com

# Следовать инструкциям, ввести email, согласиться с условиями
# Certbot сам обновит nginx конфиг для HTTPS

# Автообновление сертификата
systemctl enable certbot.timer
```

После этого nginx автоматически станет обслуживать `https://ВАШ_ДОМЕН.com` и `wss://ВАШ_ДОМЕН.com/ws`

---

## ШАГ 9 — Запуск сервера через PM2

```bash
cd /var/www/lily-wars/server

# Запустить
pm2 start server.js --name lily-wars

# Сохранить чтобы запускался при перезагрузке
pm2 save
pm2 startup
# Скопировать и выполнить команду которую PM2 выведет

# Полезные команды PM2:
pm2 status          # статус процессов
pm2 logs lily-wars  # логи в реальном времени
pm2 restart lily-wars  # перезапустить
pm2 stop lily-wars  # остановить
```

---

## ШАГ 10 — Настройка Telegram Bot и Mini App

```bash
# Открыть @BotFather в Telegram
# /newbot — если бот ещё не создан
# /mybots → выбрать бота → Bot Settings → Menu Button → Configure menu button
# URL: https://ВАШ_ДОМЕН.com
```

Или через команды BotFather:
```
/setmenubutton
# выбрать бота
# ввести URL: https://ВАШ_ДОМЕН.com
# ввести текст кнопки: 🃏 Играть
```

---

## ШАГ 11 — Обновление из GitHub

```bash
cd /var/www/lily-wars
git pull origin main
pm2 restart lily-wars
```

Или создать скрипт автообновления:
```bash
nano /var/www/lily-wars/update.sh
```
```bash
#!/bin/bash
cd /var/www/lily-wars
git pull origin main
pm2 restart lily-wars
echo "✅ Обновлено"
```
```bash
chmod +x /var/www/lily-wars/update.sh
# Теперь обновлять одной командой:
./update.sh
```

---

## Проверка что всё работает

```bash
# Проверить nginx
systemctl status nginx

# Проверить Node сервер
pm2 status

# Проверить логи сервера
pm2 logs lily-wars --lines 50

# Проверить порт
ss -tlnp | grep 8080

# Проверить WebSocket вручную
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:8080
```

---

## Структура файлов в репозитории GitHub

```
repo/
├── server/
│   ├── server.js        ← WebSocket сервер
│   └── package.json
├── client/
│   ├── index.html       ← Mini App точка входа
│   ├── js/
│   │   ├── config.js    ← Все карты и фракции
│   │   ├── game.js      ← Клиентский движок
│   │   └── bot.js       ← Бот для соло игры
│   └── css/
│       └── style.css    ← Стили
├── DEPLOY.md            ← Этот гайд
└── README.md
```

---

## Частые проблемы

**WebSocket не подключается:**
- Проверить что в game.js прописан правильный URL (`wss://`, не `ws://`)
- Проверить что nginx проксирует `/ws` на порт 8080
- Проверить файрвол: `ufw allow 80`, `ufw allow 443`

**Certbot не работает:**
- Домен должен указывать на IP сервера (A-запись в DNS)
- Подождать 5-10 минут после изменения DNS

**PM2 не запускается после перезагрузки:**
- Выполнить `pm2 startup` и скопировать выданную команду

**Telegram не открывает Mini App:**
- URL должен быть HTTPS
- Проверить что index.html доступен по адресу домена
