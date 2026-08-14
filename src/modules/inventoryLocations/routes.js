import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  create,
  getAll,
  getOne,
  update,
  toggleStatus,
  getStock,
  getMovements
} from "./controller.js";

import {
  validateCreateLocation,
  validateUpdateLocation
} from "./validation.js";


const router = express.Router();


router.use(authenticate);


// Get all locations
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

// Get stock information for a specific location
router.get(
  "/:locationId/stock",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getStock
);

// Get location movements for a specific location
router.get(
  "/:locationId/movements",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getMovements
);

// Get location by ID
router.get(
  "/:locationId",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getOne
);


// Create location
// only ADMIN can create a new location
router.post(
  "/",
  authorizeRoles(
    "ADMIN"
  ),
  validateCreateLocation,
  create
);


// Update location
router.patch(
  "/:locationId",
  authorizeRoles(
    "ADMIN"
  ),
  validateUpdateLocation,
  update
);


// Activate/deactivate
router.patch(
  "/:locationId/status",
  authorizeRoles(
    "ADMIN"
  ),
  toggleStatus
);


export default router;