import express from "express";
import db from "../config/db.js";

const router = express.Router();

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
