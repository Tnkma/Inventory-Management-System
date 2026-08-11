import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  create,
  getAll,
  getOne
} from "./controller.js";

import {
  validateCreateTransfer
} from "./validation.js";


const router = express.Router();


router.use(authenticate);


// Create transfer
router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  validateCreateTransfer,
  create
);


// Get all transfers
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


// Get transfer by ID
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


export default router;