// Simple Bot for local game
class Bot {
  constructor() {
    this.name = "Бот Лилия";
  }

  makeMove(gameState) {
    // Very simple bot logic - play random card
    console.log("🤖 Bot thinking...");
    if (gameState.myHand && gameState.myHand.length > 0) {
      return {
        action: "play",
        cardId: gameState.myHand[0].id,
        row: Math.random() > 0.5 ? "left" : "right"
      };
    }
    return { action: "pass" };
  }
}

// Global bot instance
window.bot = new Bot();
console.log("✅ Bot loaded");