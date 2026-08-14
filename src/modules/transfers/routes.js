import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  create,
  approve,
  reject,
  fulfill,
  getAll,
  getOne
} from "./controller.js";

import {
  validateCreateTransfer
} from "./validation.js";


const router = express.Router();


router.use(authenticate);


// =========================================================
// CREATE REQUEST
// =========================================================

router.post(
  "/",
  authorizeRoles(
    "KITCHEN_STAFF"
  ),
  validateCreateTransfer,
  create
);


// =========================================================
// GET ALL
// =========================================================

router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getAll
);


// =========================================================
// GET ONE
// =========================================================

router.get(
  "/:transferId",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getOne
);


// =========================================================
// APPROVE
// =========================================================

router.patch(
  "/:transferId/approve",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  approve
);


// =========================================================
// REJECT
// =========================================================

router.patch(
  "/:transferId/reject",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  reject
);


// =========================================================
// FULFILL
// =========================================================

router.patch(
  "/:transferId/fulfill",
  authorizeRoles(
    "STORE_KEEPER"
  ),
  fulfill
);


export default router;