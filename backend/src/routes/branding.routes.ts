import express from "express";
import { getBranding } from "../controllers/branding.controller.js";

const router = express.Router();

router.get("/", getBranding);

export default router;
