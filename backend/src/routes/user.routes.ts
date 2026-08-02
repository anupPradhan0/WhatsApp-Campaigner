import express from "express";
import upload from "../utils/upload.utils.js";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import {
  createUser,
  deleteUser,
  freezeUser,
  unfreezeUser,
  updateUser,
  changePassword,
  changeOwnPasswordHandler,
  updatePermissions,
} from "../controllers/user.controller.js";
import checkUserStatus from "../middleware/check-user-status.middleware.js";
import hasAuthority from "../middleware/role.middleware.js";
import { uploadUserImageToCloudinary } from "../middleware/upload-to-cloudinary.middleware.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import {
  changeOwnPasswordBodySchema,
  changePasswordBodySchema,
  createUserBodySchema,
  updateUserBodySchema,
  setPermissionsBodySchema,
} from "../validation/user.schemas.js";
import { userIdParamSchema } from "../validation/auth.schemas.js";

const router = express.Router();

router.post(
  "/create",
  isLoggedIn,
  hasAuthority,
  upload.single("image"),
  uploadUserImageToCloudinary,
  validateBody(createUserBodySchema),
  createUser
);
router.delete(
  "/delete/:userId",
  isLoggedIn,
  checkUserStatus,
  hasAuthority,
  upload.none(),
  validateParams(userIdParamSchema),
  deleteUser
);
router.put(
  "/freeze/:userId",
  isLoggedIn,
  checkUserStatus,
  hasAuthority,
  upload.none(),
  validateParams(userIdParamSchema),
  freezeUser
);
router.put(
  "/unfreeze/:userId",
  isLoggedIn,
  checkUserStatus,
  hasAuthority,
  upload.none(),
  validateParams(userIdParamSchema),
  unfreezeUser
);
router.put(
  "/update/:userId",
  isLoggedIn,
  upload.none(),
  validateParams(userIdParamSchema),
  validateBody(updateUserBodySchema),
  updateUser
);
router.put(
  "/change-password/:userId",
  isLoggedIn,
  upload.none(),
  validateParams(userIdParamSchema),
  validateBody(changePasswordBodySchema),
  changePassword
);
router.put(
  "/change-own-password",
  isLoggedIn,
  upload.none(),
  validateBody(changeOwnPasswordBodySchema),
  changeOwnPasswordHandler
);
router.put(
  "/permissions/:userId",
  isLoggedIn,
  checkUserStatus,
  hasAuthority,
  upload.none(),
  validateParams(userIdParamSchema),
  validateBody(setPermissionsBodySchema),
  updatePermissions
);

export default router;
