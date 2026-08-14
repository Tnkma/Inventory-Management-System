import express from "express";


import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";


import {
  listWastages,
  getWastage,
  recordWastageController
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
// GET ALL WASTAGE
// =========================================================

router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  listWastages
);


// =========================================================
// GET WASTAGE BY ID
// =========================================================

router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getWastage
);


// =========================================================
// RECORD WASTAGE
// =========================================================

router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  recordWastageController
);


export default router;