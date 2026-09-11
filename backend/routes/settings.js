import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET settings
router.get("/", async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update settings
router.put("/", async (req, res) => {
  try {
    const updated = await db.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
