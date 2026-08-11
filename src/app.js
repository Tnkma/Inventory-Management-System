import express from "express";
import cors from "cors";
import helmet from "helmet";

import pool from "./config/database.js";
import authRoutes from "./modules/auth/routes.js";
import errorHandler from "./middleware/error.middleware.js";
import userRoutes from "./modules/users/routes.js";
import supplierRoutes
  from "./modules/suppliers/routes.js";
import ingredientRoutes
  from "./modules/ingredients/routes.js";
import inventoryRoutes
  from "./modules/inventory/routes.js";
import purchaseRoutes
  from "./modules/purchases/routes.js";




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


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use(
  "/api/purchases",
  purchaseRoutes
);

app.use(errorHandler);


export default app;