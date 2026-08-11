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
  toggleStatus
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
router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  validateCreateLocation,
  create
);


// Update location
router.patch(
  "/:locationId",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  validateUpdateLocation,
  update
);


// Activate/deactivate
router.patch(
  "/:locationId/status",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  toggleStatus
);


export default router;