import { Router } from "express";

import {
  loginController,
  logoutAllController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "./auth.controller.js";

import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

/*
 * ==================================================
 * PUBLIC AUTH ROUTES
 * ==================================================
 */

router.post("/register", registerController);

router.post("/login", loginController);

router.post("/refresh", refreshController);

/*
 * ==================================================
 * PROTECTED AUTH ROUTES
 * ==================================================
 */

router.post("/logout", authenticate, logoutController);

router.post("/logout-all", authenticate, logoutAllController);

router.get("/me", authenticate, meController);

export default router;
