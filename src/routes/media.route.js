import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/roles.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { createMedia } from "../controllers/media.controller.js";

const router = express.Router();

router.post("/admin/create", verifyToken, authorizeRoles("admin"), upload.fields([{ name: "poster", maxCount: 1 }, { name: "banner", maxCount: 1 }]), createMedia);

export default router;