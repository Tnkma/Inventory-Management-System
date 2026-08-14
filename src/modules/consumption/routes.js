import express from "express";


import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";


import {
  listConsumptions,
  getConsumption,
  recordConsumptionController
} from "./controller.js";


const router =
  express.Router();


// =========================================================
// AUTHENTICATION
// =========================================================

router.use(
  authenticate
);


// =========================================================
// GET ALL CONSUMPTION
// =========================================================

router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "KITCHEN_STAFF",
    "STORE_KEEPER"
  ),
  listConsumptions
);


// =========================================================
// GET ONE CONSUMPTION
// =========================================================

router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "KITCHEN_STAFF",
    "STORE_KEEPER"
  ),
  getConsumption
);


// =========================================================
// RECORD CONSUMPTION
// =========================================================

router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "KITCHEN_STAFF",
    "STORE_KEEPER"
  ),
  recordConsumptionController
);


export default router;