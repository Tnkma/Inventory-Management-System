import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  create,
  list,
  getOne,
  update,
  changeStatus
} from "./controller.js";


const router = express.Router();


router.use(authenticate);


// View suppliers
router.get(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  list
);


// View supplier
router.get(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  getOne
);


// Create supplier
router.post(
  "/",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  create
);


// Update supplier
router.patch(
  "/:id",
  authorizeRoles(
    "ADMIN",
    "MANAGER",
    "STORE_KEEPER"
  ),
  update
);


// Activate/deactivate
router.patch(
  "/:id/status",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  changeStatus
);


export default router;