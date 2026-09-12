import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { seedDatabase } from "./seed.js";

import ratesRouter from "./routes/rates.js";
import purchasesRouter from "./routes/purchases.js";
import settingsRouter from "./routes/settings.js";

dotenv.config();

const app = express();
const DEFAULT_PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/rates", ratesRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/settings", settingsRouter);

// Health Check & Root Route
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK", message: "Gold Buyback Backend Server is running", timestamp: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

async function startServer(port) {
  // Seed Database with initial data if empty
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Database seed error:", err.message);
  }

  const server = app.listen(port, () => {
    console.log(`🚀 Gold Buyback Backend Server running at http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${port} is in use. Retrying connection in 1 second...`);
      setTimeout(() => {
        startServer(port);
      }, 1000);
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer(Number(DEFAULT_PORT));
