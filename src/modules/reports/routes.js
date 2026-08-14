import express
  from "express";

import authenticate
  from "../../middleware/auth.middleware.js";

import authorizeRoles
  from "../../middleware/role.middleware.js";

import {
  overviewReport
} from "./controller.js";


const router =
  express.Router();


router.use(authenticate);


// =========================================================
// OVERVIEW REPORT
// =========================================================

router.get(
  "/overview",
  authorizeRoles(
    "ADMIN",
    "MANAGER"
  ),
  overviewReport
);


export default router;