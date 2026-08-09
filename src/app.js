import express from "express";
import cors from "cors";
import helmet from "helmet";

import pool from "./config/database.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "Restaurant Inventory API is running",
      database: "connected"
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "API is running but database is unavailable",
      database: "disconnected"
    });
  }
});


export default app;