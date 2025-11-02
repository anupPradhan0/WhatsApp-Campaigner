import express from "express";
import { supportForm } from "../Controllers/support.controller.js";
import isLoggedIn from "../Middlewares/isLoggedIn.Middleware.js";
import upload from "../Utils/upload.Utils.js";

const router = express.Router();

router.post("/", isLoggedIn, upload.none(), supportForm);

export default router;
