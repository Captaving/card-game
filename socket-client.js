// socket-client.js
const SERVER_IP = '193.148.59.127';
const SOCKET_URL = `http://${SERVER_IP}:3000`; // Предполагаем порт 3000, измените если нужно

class SocketClient {
    constructor() {
        this.socket = null;
        this.user = window.Telegram.WebApp.initDataUnsafe?.user;
        this.roomId = null;
        this.isPlaying = false;
    }

    connect() {
        if (!this.user) {
            console.error("Нет данных пользователя TG");
            return;
        }

        this.socket = io(SOCKET_URL, {
            query: {
                userId: this.user.id,
                username: this.user.username || 'unknown',
                firstName: this.user.first_name
            }
        });

        this.socket.on('connect', () => {
            console.log('Connected to server:', this.socket.id);
            if(window.setupUI) window.setupUI.updateStatus('connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected');
            if(window.setupUI) window.setupUI.updateStatus('disconnected');
        });

        // Обработчики событий лобби
        this.socket.on('room_created', (data) => {
            this.roomId = data.roomId;
            if(window.lobbyUI) window.lobbyUI.onRoomCreated(data);
        });

        this.socket.on('player_joined', (data) => {
            if(window.lobbyUI) window.lobbyUI.onPlayerJoined(data);
        });

        this.socket.on('player_ready', (data) => {
            if(window.lobbyUI) window.lobbyUI.onPlayerReady(data);
        });

        this.socket.on('game_start', (data) => {
            // Оба готовы, запускаем таймер и игру
            if(window.lobbyUI) window.lobbyUI.startCountdown(10);
        });

        this.socket.on('game_data', (data) => {
            // Передача хода, карт и т.д.
            console.log('Game data received:', data);
            // Здесь будет логика синхронизации боя
        });
        
        this.socket.on('invite_received', (data) => {
             // Обработка входящего приглашения
             alert(`Игрок ${data.inviter} приглашает вас в бой!`);
        });
    }

    findMatch() {
        this.socket.emit('find_match');
    }

    inviteFriend(friendId) {
        this.socket.emit('invite_friend', { targetId: friendId });
    }

    toggleReady(isReady) {
        this.socket.emit('toggle_ready', { roomId: this.roomId, isReady });
    }

    sendMove(moveData) {
        this.socket.emit('game_move', { roomId: this.roomId, move: moveData });
    }
    
    leaveLobby() {
        this.socket.emit('leave_room', { roomId: this.roomId });
        this.roomId = null;
    }
}

const socketClient = new SocketClient();