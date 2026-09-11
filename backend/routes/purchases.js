import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET all purchases
router.get("/", async (req, res) => {
  try {
    const purchases = await db.getPurchases();
    purchases.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add a new purchase
router.post("/", async (req, res) => {
  try {
    const { id, date, time, grams, overallPrice, ratePaid, kachaAtPurchase, boardAtPurchase, thumbnail, notes, createdAt, isSold } = req.body;
    if (!date || grams === undefined || overallPrice === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const finalId = id || `pur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const purchaseEntry = {
      id: finalId,
      date,
      time: time || null,
      grams: Number(grams),
      overallPrice: Number(overallPrice),
      ratePaid: Number(ratePaid || 0),
      kachaAtPurchase: kachaAtPurchase !== undefined ? Number(kachaAtPurchase) : null,
      boardAtPurchase: boardAtPurchase !== undefined ? Number(boardAtPurchase) : null,
      thumbnail: thumbnail || null,
      notes: notes || "",
      createdAt: createdAt || Date.now(),
      isSold: Boolean(isSold),
    };

    const newPur = await db.addPurchase(purchaseEntry);
    res.status(201).json({ success: true, data: newPur });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update purchase by ID (Upsert friendly)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getPurchaseById(id);
    if (!existing) {
      // Upsert: if it doesn't exist, create it
      const newPur = await db.addPurchase({ ...req.body, id });
      return res.json({ success: true, data: newPur });
    }

    const updated = await db.updatePurchase(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a purchase by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deletePurchase(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Purchase not found" });
    }
    res.json({ success: true, message: "Purchase deleted successfully", id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
