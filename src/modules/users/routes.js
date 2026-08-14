import express from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  listUsers,
  getUser,
  createNewUser,
  changeUserRole,
  changeUserStatus,
  userRole,
  changeUserAssignment
} from "./controller.js";


const router = express.Router();


router.use(authenticate);


// View users
router.get(
  "/",
  authorizeRoles("ADMIN", "MANAGER"),
  listUsers
);


// View one user
router.get(
  "/:id",
  authorizeRoles("ADMIN", "MANAGER"),
  getUser
);


// Create user
router.post(
  "/",
  authorizeRoles("ADMIN"),
  createNewUser
);


// Change role
router.patch(
  "/:id/role",
  authorizeRoles("ADMIN"),
  changeUserRole
);


// View user role
router.get(
  "/:id/role",
  authorizeRoles("ADMIN", "MANAGER"),
  userRole
);

// Activate/deactivate
router.patch(
  "/:id/status",
  authorizeRoles("ADMIN"),
  changeUserStatus
);

router.patch(
  "/:id/assignment",
  authorizeRoles("ADMIN"),
  changeUserAssignment
);

export default router;