import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  recordConsumptionController
} from "./controller.js";


const router =
  express.Router();


router.use(authenticate);


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