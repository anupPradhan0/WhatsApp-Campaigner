import express from "express";
import {
  registration,
  login,
  logout,
  updateProfile,
  bootstrapStatus,
  bootstrapAdminHandler,
} from "../controllers/auth.controller.js";
import {
  startImpersonation,
  stopImpersonation,
} from "../controllers/impersonation.controller.js";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import upload from "../utils/upload.utils.js";
import { uploadUserImageToCloudinary } from "../middleware/upload-to-cloudinary.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  bootstrapAdminBodySchema,
  loginBodySchema,
  registrationBodySchema,
  updateProfileBodySchema,
} from "../validation/auth.schemas.js";

const router = express.Router();

router.post(
  "/register",
  upload.single("image"),
  validateBody(registrationBodySchema),
  registration
);
router.post("/login", upload.none(), validateBody(loginBodySchema), login);
router.get("/bootstrap-status", bootstrapStatus);
router.post(
  "/bootstrap-admin",
  upload.single("image"),
  uploadUserImageToCloudinary,
  validateBody(bootstrapAdminBodySchema),
  bootstrapAdminHandler
);
router.post("/logout", isLoggedIn, logout);

// Super-admin session switch. "/stop" must be declared before "/:userId".
router.post("/impersonate/stop", isLoggedIn, stopImpersonation);
router.post("/impersonate/:userId", isLoggedIn, startImpersonation);
router.put(
  "/update-profile",
  isLoggedIn,
  upload.single("image"),
  uploadUserImageToCloudinary,
  validateBody(updateProfileBodySchema),
  updateProfile
);

export default router;
