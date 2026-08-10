import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  create,
  list,
  getOne
} from "./controller.js";


const router = express.Router();


router.use(authenticate);


// List ingredients
router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  list
);


// Get one ingredient
router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER",
    "KITCHEN_STAFF"
  ),
  getOne
);


// Create ingredient
router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  create
);


export default router;