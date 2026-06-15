// ==================== SIMPLE BOT (for local games) ====================
class Bot {
  constructor() {
    this.name = "Бот Лилия";
  }

  makeMove(gameState) {
    console.log("🤖 Bot is thinking...");
    if (gameState && gameState.myHand && gameState.myHand.length > 0) {
      const card = gameState.myHand[0];
      return {
        action: "play",
        cardId: card.id,
        row: Math.random() > 0.5 ? "left" : "right"
      };
    }
    return { action: "pass" };
  }
}

// Expose globally
window.bot = new Bot();
console.log('%c✅ Bot loaded', 'color:#88aaff');
