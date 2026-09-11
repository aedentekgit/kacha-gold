import db from "./config/db.js";

const INITIAL_RATES = [];
const INITIAL_PURCHASES = [];

export async function seedDatabase() {
  try {
    // Purge any pre-populated mock data from database tables
    await db.clearMockData();

    const currentRates = await db.getRates();
    if (!currentRates || currentRates.length === 0) {
      for (const r of INITIAL_RATES) {
        await db.addRate(r);
      }
    }

    const currentPurchases = await db.getPurchases();
    if (!currentPurchases || currentPurchases.length === 0) {
      for (const p of INITIAL_PURCHASES) {
        await db.addPurchase(p);
      }
    }

    const settings = await db.getSettings();
    if (!settings.targetProfit) {
      await db.updateSettings({ targetProfit: 250, targetProfitPct: 5 });
    }
  } catch (err) {
    console.error("Database seed error:", err.message);
  }
}
