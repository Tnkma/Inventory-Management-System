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
  updateStatus
} from "./controller.js";

import {
  validateCreateCategory,
  validateUpdateCategory,
  validateCategoryStatus
} from "./validation.js";


const router = express.Router();


router.use(authenticate);


// =========================================================
// GET ALL CATEGORIES
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
// GET CATEGORY BY ID
// =========================================================

router.get(
  "/:categoryId",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getOne
);


// =========================================================
// CREATE CATEGORY
// =========================================================

router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  validateCreateCategory,
  create
);


// =========================================================
// UPDATE CATEGORY
// =========================================================

router.patch(
  "/:categoryId",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  validateUpdateCategory,
  update
);


// =========================================================
// UPDATE CATEGORY STATUS
// =========================================================

router.patch(
  "/:categoryId/status",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  validateCategoryStatus,
  updateStatus
);


export default router;