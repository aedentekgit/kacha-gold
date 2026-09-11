import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFilePath = path.join(__dirname, "..", "gold_db.json");

// ---------------------------------------------------------
// Local JSON File Fallback Helpers
// ---------------------------------------------------------
const initialDb = {
  rates: [],
  purchases: [],
  settings: {
    targetProfit: 250,
    targetProfitPct: 5,
    appPin: "123456",
  },
};

function initJsonFile() {
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2), "utf-8");
  }
}

function readJsonDb() {
  try {
    initJsonFile();
    const data = fs.readFileSync(dbFilePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading JSON db file:", err.message);
    return { ...initialDb };
  }
}

function writeJsonDb(data) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to JSON db file:", err.message);
  }
}

// ---------------------------------------------------------
// MySQL Connection Pool Setup
// ---------------------------------------------------------
let pool = null;
let useMySQL = false;

const dbHost = process.env.DB_HOST || "145.79.209.121";
const dbUser = process.env.DB_USER || "u248216155_kacha";
const dbPass = process.env.DB_PASS || "Goldkacha@123";
const dbName = process.env.DB_NAME || "u248216155_kacha";
const dbPort = Number(process.env.DB_PORT || 3306);

async function initDB() {
  try {
    pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
    });

    const connection = await pool.getConnection();
    console.log(`✅ Connected to MySQL Database: ${dbName} @ ${dbHost}`);
    connection.release();

    await createTablesIfNotExist();
    useMySQL = true;
  } catch (err) {
    console.warn(`⚠️ MySQL Connection failed (${err.message}). Falling back to JSON storage.`);
    useMySQL = false;
  }
}

async function createTablesIfNotExist() {
  if (!pool) return;

  const createRatesTable = `
    CREATE TABLE IF NOT EXISTS rates (
      id VARCHAR(64) PRIMARY KEY,
      date VARCHAR(10) NOT NULL,
      time VARCHAR(20) NOT NULL,
      board DECIMAL(10, 2) NOT NULL,
      kacha DECIMAL(10, 2) NOT NULL,
      created_at BIGINT NOT NULL,
      user_logged TINYINT(1) DEFAULT 1,
      auto_synced TINYINT(1) DEFAULT 0,
      source VARCHAR(255) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createPurchasesTable = `
    CREATE TABLE IF NOT EXISTS purchases (
      id VARCHAR(64) PRIMARY KEY,
      date VARCHAR(10) NOT NULL,
      time VARCHAR(20) DEFAULT NULL,
      grams DECIMAL(10, 3) NOT NULL,
      overall_price DECIMAL(12, 2) NOT NULL,
      rate_paid DECIMAL(10, 2) NOT NULL,
      kacha_at_purchase DECIMAL(10, 2) NULL,
      board_at_purchase DECIMAL(10, 2) NULL,
      thumbnail LONGTEXT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      is_sold TINYINT(1) DEFAULT 0,
      created_at BIGINT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(64) PRIMARY KEY,
      \`value\` TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await pool.query(createRatesTable);
    await pool.query(createPurchasesTable);
    await pool.query(createSettingsTable);
  } catch (err) {
    console.error("Error creating tables:", err.message);
  }
}

initDB();

// ---------------------------------------------------------
// Unified Database Interface
// ---------------------------------------------------------
export const db = {
  // Rates Methods
  async getRates() {
    if (useMySQL && pool) {
      try {
        const [rows] = await pool.query("SELECT * FROM rates ORDER BY created_at ASC");
        return rows.map((r) => ({
          id: r.id,
          date: r.date,
          time: r.time,
          board: Number(r.board),
          kacha: Number(r.kacha),
          createdAt: Number(r.created_at),
          userLogged: Boolean(r.user_logged),
          autoSynced: Boolean(r.auto_synced),
          source: r.source || undefined,
        }));
      } catch (err) {
        console.error("MySQL getRates error:", err.message);
      }
    }
    return readJsonDb().rates || [];
  },

  async getRateById(id) {
    if (useMySQL && pool) {
      try {
        const [rows] = await pool.query("SELECT * FROM rates WHERE id = ?", [id]);
        if (rows.length === 0) return null;
        const r = rows[0];
        return {
          id: r.id,
          date: r.date,
          time: r.time,
          board: Number(r.board),
          kacha: Number(r.kacha),
          createdAt: Number(r.created_at),
          userLogged: Boolean(r.user_logged),
          autoSynced: Boolean(r.auto_synced),
          source: r.source || undefined,
        };
      } catch (err) {
        console.error("MySQL getRateById error:", err.message);
      }
    }
    return (readJsonDb().rates || []).find((r) => r.id === id) || null;
  },

  async addRate(rate) {
    if (useMySQL && pool) {
      try {
        const query = `
          INSERT INTO rates (id, date, time, board, kacha, created_at, user_logged, auto_synced, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            date=VALUES(date), time=VALUES(time), board=VALUES(board), kacha=VALUES(kacha),
            created_at=VALUES(created_at), user_logged=VALUES(user_logged), auto_synced=VALUES(auto_synced), source=VALUES(source)
        `;
        await pool.query(query, [
          rate.id,
          rate.date,
          rate.time,
          rate.board,
          rate.kacha,
          rate.createdAt || Date.now(),
          rate.userLogged ? 1 : 0,
          rate.autoSynced ? 1 : 0,
          rate.source || null,
        ]);
        return rate;
      } catch (err) {
        console.error("MySQL addRate error:", err.message);
      }
    }
    const data = readJsonDb();
    data.rates = data.rates || [];
    const index = data.rates.findIndex((r) => r.id === rate.id);
    if (index >= 0) {
      data.rates[index] = rate;
    } else {
      data.rates.push(rate);
    }
    writeJsonDb(data);
    return rate;
  },

  async updateRate(id, updatedFields) {
    if (useMySQL && pool) {
      try {
        const existing = await this.getRateById(id);
        if (!existing) return null;
        const merged = { ...existing, ...updatedFields };

        const query = `
          UPDATE rates
          SET date = ?, time = ?, board = ?, kacha = ?, created_at = ?, user_logged = ?, auto_synced = ?, source = ?
          WHERE id = ?
        `;
        await pool.query(query, [
          merged.date,
          merged.time,
          merged.board,
          merged.kacha,
          merged.createdAt || Date.now(),
          merged.userLogged ? 1 : 0,
          merged.autoSynced ? 1 : 0,
          merged.source || null,
          id,
        ]);
        return merged;
      } catch (err) {
        console.error("MySQL updateRate error:", err.message);
      }
    }
    const data = readJsonDb();
    data.rates = data.rates || [];
    const index = data.rates.findIndex((r) => r.id === id);
    if (index === -1) return null;
    data.rates[index] = { ...data.rates[index], ...updatedFields };
    writeJsonDb(data);
    return data.rates[index];
  },

  async deleteRate(id) {
    if (useMySQL && pool) {
      try {
        const [result] = await pool.query("DELETE FROM rates WHERE id = ?", [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error("MySQL deleteRate error:", err.message);
      }
    }
    const data = readJsonDb();
    data.rates = data.rates || [];
    const index = data.rates.findIndex((r) => r.id === id);
    if (index === -1) return false;
    data.rates.splice(index, 1);
    writeJsonDb(data);
    return true;
  },

  // Purchases Methods
  async getPurchases() {
    if (useMySQL && pool) {
      try {
        const [rows] = await pool.query("SELECT * FROM purchases ORDER BY created_at ASC");
        return rows.map((p) => ({
          id: p.id,
          date: p.date,
          time: p.time,
          grams: Number(p.grams),
          overallPrice: Number(p.overall_price),
          ratePaid: Number(p.rate_paid),
          kachaAtPurchase: p.kacha_at_purchase !== null ? Number(p.kacha_at_purchase) : null,
          boardAtPurchase: p.board_at_purchase !== null ? Number(p.board_at_purchase) : null,
          thumbnail: p.thumbnail,
          notes: p.notes,
          isSold: Boolean(p.is_sold),
          createdAt: Number(p.created_at),
        }));
      } catch (err) {
        console.error("MySQL getPurchases error:", err.message);
      }
    }
    return readJsonDb().purchases || [];
  },

  async getPurchaseById(id) {
    if (useMySQL && pool) {
      try {
        const [rows] = await pool.query("SELECT * FROM purchases WHERE id = ?", [id]);
        if (rows.length === 0) return null;
        const p = rows[0];
        return {
          id: p.id,
          date: p.date,
          time: p.time,
          grams: Number(p.grams),
          overallPrice: Number(p.overall_price),
          ratePaid: Number(p.rate_paid),
          kachaAtPurchase: p.kacha_at_purchase !== null ? Number(p.kacha_at_purchase) : null,
          boardAtPurchase: p.board_at_purchase !== null ? Number(p.board_at_purchase) : null,
          thumbnail: p.thumbnail,
          notes: p.notes,
          isSold: Boolean(p.is_sold),
          createdAt: Number(p.created_at),
        };
      } catch (err) {
        console.error("MySQL getPurchaseById error:", err.message);
      }
    }
    return (readJsonDb().purchases || []).find((p) => p.id === id) || null;
  },

  async addPurchase(purchase) {
    if (useMySQL && pool) {
      try {
        const query = `
          INSERT INTO purchases (id, date, time, grams, overall_price, rate_paid, kacha_at_purchase, board_at_purchase, thumbnail, notes, is_sold, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            date=VALUES(date), time=VALUES(time), grams=VALUES(grams), overall_price=VALUES(overall_price),
            rate_paid=VALUES(rate_paid), kacha_at_purchase=VALUES(kacha_at_purchase), board_at_purchase=VALUES(board_at_purchase),
            thumbnail=VALUES(thumbnail), notes=VALUES(notes), is_sold=VALUES(is_sold), created_at=VALUES(created_at)
        `;
        await pool.query(query, [
          purchase.id,
          purchase.date,
          purchase.time || null,
          purchase.grams,
          purchase.overallPrice,
          purchase.ratePaid,
          purchase.kachaAtPurchase !== undefined && purchase.kachaAtPurchase !== null ? purchase.kachaAtPurchase : null,
          purchase.boardAtPurchase !== undefined && purchase.boardAtPurchase !== null ? purchase.boardAtPurchase : null,
          purchase.thumbnail || null,
          purchase.notes || null,
          purchase.isSold ? 1 : 0,
          purchase.createdAt || Date.now(),
        ]);
        return purchase;
      } catch (err) {
        console.error("MySQL addPurchase error:", err.message);
      }
    }
    const data = readJsonDb();
    data.purchases = data.purchases || [];
    const index = data.purchases.findIndex((p) => p.id === purchase.id);
    if (index >= 0) {
      data.purchases[index] = purchase;
    } else {
      data.purchases.push(purchase);
    }
    writeJsonDb(data);
    return purchase;
  },

  async updatePurchase(id, updatedFields) {
    if (useMySQL && pool) {
      try {
        const existing = await this.getPurchaseById(id);
        if (!existing) return null;
        const merged = { ...existing, ...updatedFields };

        const query = `
          UPDATE purchases
          SET date = ?, time = ?, grams = ?, overall_price = ?, rate_paid = ?,
              kacha_at_purchase = ?, board_at_purchase = ?, thumbnail = ?, notes = ?, is_sold = ?, created_at = ?
          WHERE id = ?
        `;
        await pool.query(query, [
          merged.date,
          merged.time || null,
          merged.grams,
          merged.overallPrice,
          merged.ratePaid,
          merged.kachaAtPurchase !== undefined && merged.kachaAtPurchase !== null ? merged.kachaAtPurchase : null,
          merged.boardAtPurchase !== undefined && merged.boardAtPurchase !== null ? merged.boardAtPurchase : null,
          merged.thumbnail || null,
          merged.notes || null,
          merged.isSold ? 1 : 0,
          merged.createdAt || Date.now(),
          id,
        ]);
        return merged;
      } catch (err) {
        console.error("MySQL updatePurchase error:", err.message);
      }
    }
    const data = readJsonDb();
    data.purchases = data.purchases || [];
    const index = data.purchases.findIndex((p) => p.id === id);
    if (index === -1) return null;
    data.purchases[index] = { ...data.purchases[index], ...updatedFields };
    writeJsonDb(data);
    return data.purchases[index];
  },

  async deletePurchase(id) {
    if (useMySQL && pool) {
      try {
        const [result] = await pool.query("DELETE FROM purchases WHERE id = ?", [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error("MySQL deletePurchase error:", err.message);
      }
    }
    const data = readJsonDb();
    data.purchases = data.purchases || [];
    const index = data.purchases.findIndex((p) => p.id === id);
    if (index === -1) return false;
    data.purchases.splice(index, 1);
    writeJsonDb(data);
    return true;
  },

  // Settings Methods
  async getSettings() {
    if (useMySQL && pool) {
      try {
        const [rows] = await pool.query("SELECT * FROM settings");
        const settings = { targetProfit: 250, targetProfitPct: 5, appPin: "123456" };
        for (const row of rows) {
          if (row.key.toLowerCase().includes("pin")) {
            settings[row.key] = String(row.value);
          } else {
            const val = Number(row.value);
            settings[row.key] = isNaN(val) ? row.value : val;
          }
        }
        if (!settings.appPin && settings.pin) {
          settings.appPin = String(settings.pin);
        }
        return settings;
      } catch (err) {
        console.error("MySQL getSettings error:", err.message);
      }
    }
    const jsonSettings = readJsonDb().settings || {};
    return {
      targetProfit: 250,
      targetProfitPct: 5,
      appPin: "123456",
      ...jsonSettings,
    };
  },

  async updateSettings(updatedSettings) {
    if (useMySQL && pool) {
      try {
        for (const [key, val] of Object.entries(updatedSettings)) {
          await pool.query(
            "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
            [key, String(val)]
          );
        }
        return await this.getSettings();
      } catch (err) {
        console.error("MySQL updateSettings error:", err.message);
      }
    }
    const data = readJsonDb();
    data.settings = { ...data.settings, ...updatedSettings };
    writeJsonDb(data);
    return data.settings;
  },

  async clearMockData() {
    if (useMySQL && pool) {
      try {
        await pool.query("DELETE FROM rates WHERE id LIKE 'rate-%'");
        await pool.query("DELETE FROM purchases WHERE id LIKE 'pur-%'");
        console.log("✅ Cleared mock rates and purchases from MySQL database.");
      } catch (err) {
        console.error("MySQL clearMockData error:", err.message);
      }
    }
    const data = readJsonDb();
    data.rates = (data.rates || []).filter((r) => !r.id.startsWith("rate-"));
    data.purchases = (data.purchases || []).filter((p) => !p.id.startsWith("pur-"));
    writeJsonDb(data);
  },
};

export default db;
