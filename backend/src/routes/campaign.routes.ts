import { Router } from "express";
import {
  createCampaign,
  campaignStats,
} from "../controllers/campaign.controller.js";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import upload from "../utils/upload.utils.js";
import { uploadCampaignFileToCloudinary } from "../middleware/upload-to-cloudinary.middleware.js";
import { validateBody, validateParams } from "../middleware/validate.middleware.js";
import { idempotencyMiddleware } from "../middleware/idempotency.middleware.js";
import {
  campaignStatsBodySchema,
  createCampaignBodySchema,
} from "../validation/campaign.schemas.js";
import { campaignIdParamSchema } from "../validation/auth.schemas.js";

const router = Router();

router.post(
  "/",
  isLoggedIn,
  idempotencyMiddleware("campaigns.create"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "profileImage", maxCount: 1 },
  ]),
  uploadCampaignFileToCloudinary,
  validateBody(createCampaignBodySchema),
  createCampaign
);
router.put(
  "/stats/:campaignId",
  upload.none(),
  isLoggedIn,
  validateParams(campaignIdParamSchema),
  validateBody(campaignStatsBodySchema),
  campaignStats
);

export default router;
