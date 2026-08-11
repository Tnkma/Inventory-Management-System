import express from "express";

// Authentication middleware
import authenticate from "../../middleware/auth.middleware.js";
import authorizeRoles from "../../middleware/role.middleware.js";

import {
  getAllInventory,
  getInventoryItem,
  updateIngredientStock,
  getStockMovementHistory,
  checkIngredientLowStock
} from "./controller.js";


const router = express.Router();

router.use(authenticate);


router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getAllInventory
);


router.get(
  "/movements",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  getStockMovementHistory
);


router.get(
  "/:ingredientId/low-stock",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  checkIngredientLowStock
);


router.get(
  "/:ingredientId",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getInventoryItem
);


router.patch(
  "/:ingredientId/stock",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  updateIngredientStock
);

export default router;