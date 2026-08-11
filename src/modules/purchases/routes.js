import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  createPurchaseController,
  getAllPurchasesController,
  getPurchaseController,
  completePurchaseController,
  cancelPurchaseController
} from "./controller.js";


const router = express.Router();


router.use(authenticate);


// =========================================================
// GET ALL PURCHASES
// =========================================================

router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  getAllPurchasesController
);


// =========================================================
// GET PURCHASE BY ID
// =========================================================

router.get(
  "/:purchaseId",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  getPurchaseController
);


// =========================================================
// CREATE PURCHASE
// =========================================================

router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  createPurchaseController
);


// =========================================================
// COMPLETE PURCHASE
// =========================================================

router.patch(
  "/:purchaseId/complete",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  completePurchaseController
);



// =========================================================
// CANCEL PURCHASE
// =========================================================

router.patch(
  "/:purchaseId/cancel",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  cancelPurchaseController
);

export default router;