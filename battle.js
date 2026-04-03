class BattleSystem {
    constructor() {
        this.state = {
            round: 1,
            maxRounds: 3,
            coinsP1: 0,
            coinsP2: 0,
            scoreP1: 0,
            scoreP2: 0,
            deckP1: [],
            deckP2: [],
            handP1: [],
            handP2: [],
            boardP1: [], // {card, row, id, currentPower, currentHealth, currentArmor}
            boardP2: [],
            manaP1: 1,
            manaP2: 1,
            turn: 'p1', 
            gameOver: false,
            winner: null,
            usedLeaderAbility: false
        };
        this.selectedTarget = null; // Для таргетированных эффектов
    }

    initGame(deck1, deck2) {
        this.state.deckP1 = JSON.parse(JSON.stringify(deck1));
        this.state.deckP2 = JSON.parse(JSON.stringify(deck2));
        this.shuffle(this.state.deckP1);
        this.shuffle(this.state.deckP2);
        
        // Стартовая рука
        this.drawCards('p1', Math.min(10, this.state.deckP1.length));
        this.drawCards('p2', Math.min(10, this.state.deckP2.length));
        
        this.updateUI();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    drawCards(player, count) {
        const deck = player === 'p1' ? this.state.deckP1 : this.state.deckP2;
        const hand = player === 'p1' ? this.state.handP1 : this.state.handP2;
        for (let i = 0; i < count; i++) {
            if (deck.length > 0 && hand.length < 10) { // Макс рука 10
                hand.push({...deck.pop(), instanceId: Math.random().toString(36)});
            }
        }
    }

    playCard(cardIndex, targetRow = 'left') {
        if (this.state.gameOver || this.state.turn !== 'p1') return;
        
        const hand = this.state.handP1;
        if (cardIndex >= hand.length) return;
        const card = hand[cardIndex];

        // Проверка маны (упрощенно: мана = номер хода или фиксирована)
        // В вашей системе маны нет явно, но есть лимит влияния/колоды. 
        // Для демо считаем, что мана бесконечна или равна номеру раунда * 5
        const maxMana = this.state.round * 5 + 5;
        if (card.influence > maxMana) {
             tg.showAlert(`Недостаточно влияния! Нужно ${card.influence}, доступно ${maxMana}`);
             return;
        }

        // Разыгрывание
        hand.splice(cardIndex, 1);
        const newCard = {
            ...card,
            currentPower: card.power,
            currentHealth: card.health,
            currentArmor: card.armor,
            row: card.row === 'any' ? targetRow : card.row,
            maxHealth: card.health
        };

        this.state.boardP1.push(newCard);
        tg.HapticFeedback.impactOccurred('light');

        // Эффект при выходе (OnPlay)
        if (card.effect && card.effect.type === 'onPlay') {
            this.handleEffect(card.effect, 'p1', newCard);
        }

        this.endTurn();
    }

    handleEffect(effect, player, sourceCard) {
        // Упрощенная обработка эффектов. В полной версии нужен UI выбора цели.
        const myBoard = player === 'p1' ? this.state.boardP1 : this.state.boardP2;
        const enemyBoard = player === 'p1' ? this.state.boardP2 : this.state.boardP1;

        if (effect.action === 'damage') {
            // Нанести урон случайному врагу (для демо)
            if (enemyBoard.length > 0) {
                const target = enemyBoard[Math.floor(Math.random() * enemyBoard.length)];
                target.currentHealth -= effect.value;
                tg.showAlert(`${sourceCard.name} нанес ${effect.value} урона ${target.name}!`);
            }
        } else if (effect.action === 'buff') {
            // Бафф себя или случайного союзника
            if (myBoard.length > 1) {
                const target = myBoard.find(c => c.instanceId !== sourceCard.instanceId) || sourceCard;
                if(effect.stat === 'power') target.currentPower += effect.value;
                if(effect.stat === 'health') {
                    target.currentHealth += effect.value;
                    target.maxHealth += effect.value;
                }
                tg.showAlert(`${sourceCard.name} усилил ${target.name}!`);
            }
        } else if (effect.action === 'heal') {
             if (myBoard.length > 0) {
                const target = myBoard[Math.floor(Math.random() * myBoard.length)];
                target.currentHealth += effect.value;
                if(target.currentHealth > target.maxHealth) target.currentHealth = target.maxHealth;
            }
        }
        // Остальные эффекты требуют сложного UI выбора
    }

    endTurn() {
        // Проверка смерти
        this.cleanupDead();

        // Подсчет очков (сумма силы на поле)
        this.calculateScore();

        // Проверка конца раунда (если руки пусты или лимит карт)
        if (this.state.handP1.length === 0 && this.state.handP2.length === 0) {
            this.finishRound();
            return;
        }

        // Смена хода
        this.state.turn = this.state.turn === 'p1' ? 'p2' : 'p1';
        
        if (this.state.turn === 'p2') {
            setTimeout(() => this.botMove(), 1000);
        }
        this.updateUI();
    }

    botMove() {
        if (this.state.gameOver || this.state.turn !== 'p2') return;
        const hand = this.state.handP2;
        if (hand.length > 0) {
            // Бот играет случайную доступную карту
            const idx = Math.floor(Math.random() * hand.length);
            const card = hand[idx];
            const row = card.row === 'any' ? (Math.random() > 0.5 ? 'left' : 'right') : card.row;
            
            hand.splice(idx, 1);
            const newCard = {
                ...card,
                currentPower: card.power,
                currentHealth: card.health,
                currentArmor: card.armor,
                row: row,
                maxHealth: card.health
            };
            this.state.boardP2.push(newCard);
            
            if (card.effect && card.effect.type === 'onPlay') {
                 // Упрощенный эффект бота
                 if(card.effect.action === 'damage' && this.state.boardP1.length > 0) {
                     this.state.boardP1[0].currentHealth -= card.effect.value;
                 }
            }
        }
        this.endTurn();
    }

    cleanupDead() {
        this.state.boardP1 = this.state.boardP1.filter(c => {
            if (c.currentHealth <= 0) {
                // Эффект OnDeath
                if(c.effect && c.effect.type === 'onDeath') {
                    // Логика смерти
                }
                return false;
            }
            return true;
        });
        this.state.boardP2 = this.state.boardP2.filter(c => c.currentHealth > 0);
    }

    calculateScore() {
        this.state.scoreP1 = this.state.boardP1.reduce((sum, c) => sum + c.currentPower, 0);
        this.state.scoreP2 = this.state.boardP2.reduce((sum, c) => sum + c.currentPower, 0);
    }

    finishRound() {
        let msg = "";
        if (this.state.scoreP1 > this.state.scoreP2) {
            this.state.coinsP1++;
            msg = `Раунд ${this.state.round}!\nВы победили (+1 🪙)`;
        } else if (this.state.scoreP2 > this.state.scoreP1) {
            this.state.coinsP2++;
            msg = `Раунд ${this.state.round}!\nПротивник победил (+1 🪙)`;
        } else {
            msg = `Раунд ${this.state.round}!\nНичья!`;
        }

        tg.showAlert(msg);

        // Проверка победы в матче (2 монеты)
        if (this.state.coinsP1 >= 2) {
            this.endGame('win');
            return;
        }
        if (this.state.coinsP2 >= 2) {
            this.endGame('lose');
            return;
        }

        // Следующий раунд
        if (this.state.round < this.state.maxRounds) {
            this.state.round++;
            this.resetRound();
        } else {
            // Конец 3 раунда, победа по монетам
            if (this.state.coinsP1 > this.state.coinsP2) this.endGame('win');
            else if (this.state.coinsP2 > this.state.coinsP1) this.endGame('lose');
            else this.endGame('draw');
        }
    }

    resetRound() {
        this.state.boardP1 = [];
        this.state.boardP2 = [];
        this.state.scoreP1 = 0;
        this.state.scoreP2 = 0;
        // Карты из руки не сбрасываются, как в Гвинте, но можно добавить добор
        this.drawCards('p1', 1);
        this.drawCards('p2', 1);
        tg.showAlert(`Начинается Раунд ${this.state.round}!`);
        this.updateUI();
    }

    endGame(result) {
        this.state.gameOver = true;
        let msg = result === 'win' ? "🏆 ПОБЕДА В МАТЧЕ!" : (result === 'lose' ? "💀 ПОРАЖЕНИЕ" : "🤝 НИЧЬЯ");
        tg.showAlert(msg);
        setTimeout(() => window.location.href = 'index.html', 3000);
    }

    updateUI() {
        // Обновление DOM элементов
        const elRound = document.getElementById('round-display');
        const elCoinsP1 = document.getElementById('coins-p1');
        const elCoinsP2 = document.getElementById('coins-p2');
        const elScoreP1 = document.getElementById('score-p1');
        const elScoreP2 = document.getElementById('score-p2');
        const elHand = document.getElementById('player-hand');
        const elBoardP1 = document.getElementById('player-lane');
        const elBoardP2 = document.getElementById('enemy-lane');

        if(elRound) elRound.innerText = `Раунд: ${this.state.round}/${this.state.maxRounds}`;
        if(elCoinsP1) elCoinsP1.innerText = `🪙 ${this.state.coinsP1}`;
        if(elCoinsP2) elCoinsP2.innerText = `🪙 ${this.state.coinsP2}`;
        if(elScoreP1) elScoreP1.innerText = `Сила: ${this.state.scoreP1}`;
        if(elScoreP2) elScoreP2.innerText = `Сила: ${this.state.scoreP2}`;

        // Рендер руки
        if(elHand) {
            elHand.innerHTML = '';
            if(this.state.turn === 'p1') {
                this.state.handP1.forEach((card, idx) => {
                    const div = document.createElement('div');
                    div.className = 'card';
                    div.innerHTML = `
                        <div class="card-cost">${card.influence}</div>
                        <div class="card-name">${card.name}</div>
                        <div class="card-stats">⚔️${card.power} ❤️${card.health}</div>
                    `;
                    div.onclick = () => this.playCard(idx);
                    elHand.appendChild(div);
                });
            }
        }

        // Рендер поля (упрощенно)
        const renderBoard = (board, container) => {
            if(!container) return;
            container.innerHTML = '';
            board.forEach(c => {
                const div = document.createElement('div');
                div.className = 'card small';
                div.style.borderColor = c.row === 'left' ? '#f00' : '#00f'; // Визуализация ряда
                div.innerHTML = `
                    <div>${c.name}</div>
                    <div>⚔️${c.currentPower} ❤️${c.currentHealth}</div>
                `;
                container.appendChild(div);
            });
        };
        renderBoard(this.state.boardP2, elBoardP2);
        renderBoard(this.state.boardP1, elBoardP1);
    }
}

const battle = new BattleSystem();