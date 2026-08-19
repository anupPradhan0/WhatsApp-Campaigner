import express from "express";
import {
  deleteDomain,
  getDomain,
  postVerifyDomain,
  putDomain,
} from "../controllers/domain.controller.js";
import isLoggedIn from "../middleware/is-logged-in.middleware.js";
import upload from "../utils/upload.utils.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { setDomainBodySchema } from "../validation/domain.schemas.js";

const router = express.Router();

router.get("/", isLoggedIn, getDomain);
router.put("/", isLoggedIn, upload.none(), validateBody(setDomainBodySchema), putDomain);
router.delete("/", isLoggedIn, deleteDomain);
router.post("/verify", isLoggedIn, upload.none(), postVerifyDomain);

export default router;
