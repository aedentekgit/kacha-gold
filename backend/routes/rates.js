import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET live GoodReturns 22K rate (server-side proxy)
router.get("/goodreturns", async (req, res) => {
  try {
    const response = await fetch("https://www.goodreturns.in/gold-rates/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: `GoodReturns fetch failed: ${response.statusText}` });
    }
    const html = await response.text();
    const m = html.match(/22k\s*Gold[^]*?class="[^"]*ticker-value[^"]*">\s*₹?\s*([0-9,]+)/i)
      || html.match(/₹?\s*([0-9,]{4,6})\s*per gram for 22 karat/i)
      || html.match(/22k\s*Gold[^]*?₹\s*([0-9,]{4,6})/i)
      || html.match(/22\s*Karat[^\d]{1,100}₹?\s*([0-9,]{4,6})/i);

    if (m && m[1]) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 1000 && val < 50000) {
        return res.json({ success: true, rate: val, source: "GoodReturns.in" });
      }
    }
    return res.status(422).json({ success: false, error: "Could not parse 22K rate from GoodReturns HTML" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all rates
router.get("/", async (req, res) => {
  try {
    const rates = await db.getRates();
    rates.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    res.json({ success: true, data: rates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add a new rate
router.post("/", async (req, res) => {
  try {
    const { id, date, time, board, kacha, createdAt, userLogged, autoSynced, source } = req.body;
    if (!date || !time || board === undefined || kacha === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const finalId = id || `rate_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const rateEntry = {
      id: finalId,
      date,
      time,
      board: Number(board),
      kacha: Number(kacha),
      createdAt: createdAt || Date.now(),
      userLogged: userLogged !== undefined ? Boolean(userLogged) : true,
      autoSynced: autoSynced !== undefined ? Boolean(autoSynced) : false,
      source: source || undefined,
    };

    const newRate = await db.addRate(rateEntry);
    res.status(201).json({ success: true, data: newRate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update a rate by ID (Upsert friendly)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getRateById(id);
    if (!existing) {
      const newRate = await db.addRate({ ...req.body, id });
      return res.json({ success: true, data: newRate });
    }

    const updated = await db.updateRate(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a rate by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteRate(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Rate entry not found" });
    }
    res.json({ success: true, message: "Rate deleted successfully", id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
