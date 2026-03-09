import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/roles.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { createMedia, deleteMedia, fetchMedias, getMediaById, getTrailer, getTrending, searchMedia, updateMedia } from "../controllers/media.controller.js";

const router = express.Router();

router.post("/admin/create", verifyToken, authorizeRoles("admin"), upload.fields([{ name: "poster", maxCount: 1 }, { name: "banner", maxCount: 1 }]), createMedia);
router.patch("/admin/update/:mediaId", verifyToken, authorizeRoles("admin"), upload.fields([{ name: "poster", maxCount: 1 }, { name: "banner", maxCount: 1 }]), updateMedia);
router.get("/", verifyToken, fetchMedias);
router.patch("/admin/delete/:mediaId", verifyToken, authorizeRoles("admin"), deleteMedia);

router.get("/search", verifyToken, searchMedia);

router.get("/trailer/:mediaType/:mediaId", verifyToken, getTrailer);
router.get("/trending/:type", verifyToken, getTrending);

router.get("/:mediaId", verifyToken, getMediaById);
export default router;