import express from "express";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import {
  businessDetails,
  dashboard,
  transaction,
  news,
  complaints,
  manageReseller,
  manageUser,
  manageAdmin,
  treeView,
  whatsAppReports,
  allCampaigns,
  campaignDetails,
  campaignNumbers,
  support,
} from "../controllers/dashboard.controller.js";
import { exportCampaignToExcel } from "../controllers/export.controller.js";
import { validateParams } from "../middleware/validate.middleware.js";
import { campaignIdParamSchema } from "../validation/auth.schemas.js";

const router = express.Router();

router.get("/manage-business", isLoggedIn, businessDetails);
router.get("/home", isLoggedIn, dashboard);
router.get("/transaction", isLoggedIn, transaction);
router.get("/news", isLoggedIn, news);
router.get("/complaints", isLoggedIn, complaints);
router.get("/manage-reseller", isLoggedIn, manageReseller);
router.get("/manage-user", isLoggedIn, manageUser);
router.get("/manage-admin", isLoggedIn, manageAdmin);
router.get("/tree-view", isLoggedIn, treeView);
router.get("/whatsapp-reports", isLoggedIn, whatsAppReports);
router.get(
  "/export-campaign/:campaignId",
  isLoggedIn,
  validateParams(campaignIdParamSchema),
  exportCampaignToExcel
);
router.get("/all-campaigns", isLoggedIn, allCampaigns);
router.get(
  "/campaign/:campaignId",
  isLoggedIn,
  validateParams(campaignIdParamSchema),
  campaignDetails
);
router.get(
  "/campaign/:campaignId/numbers",
  isLoggedIn,
  validateParams(campaignIdParamSchema),
  campaignNumbers
);
router.get("/support", isLoggedIn, support);

export default router;
