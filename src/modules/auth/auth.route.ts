import { Router } from "express";

import { adminLoginController, adminRefreshController, loginController, logoutAllController, logoutController, meController, refreshController, registerController } from "./auth.controller.js";

import { authenticate } from "../../middleware/authenticate.js";

import { loginRateLimit, refreshRateLimit, registrationRateLimit } from "../../middleware/authRateLimit.js";

const router = Router();

/*
 * ==================================================
 * STUDENT AUTHENTICATION
 * ==================================================
 *
 * Public registration creates STUDENT accounts only.
 * Student login and refresh reject administrative roles.
 */

router.post("/register", registrationRateLimit, registerController);

router.post("/login", loginRateLimit, loginController);

router.post("/refresh", refreshRateLimit, refreshController);

/*
 * ==================================================
 * ADMIN AUTHENTICATION
 * ==================================================
 *
 * ADMIN and SUPER_ADMIN accounts only.
 *
 * Separate endpoints use separate refresh cookies.
 */

router.post("/admin/login", loginRateLimit, adminLoginController);

router.post("/admin/refresh", refreshRateLimit, adminRefreshController);

/*
 * ==================================================
 * PROTECTED AUTHENTICATION
 * ==================================================
 *
 * Access tokens are verified by authenticate middleware.
 * Logout controllers clear the appropriate refresh cookie.
 */

router.post("/logout", authenticate, logoutController);

router.post("/logout-all", authenticate, logoutAllController);

router.get("/me", authenticate, meController);

export default router;
