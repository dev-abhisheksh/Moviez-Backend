import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import { addToHistory, getWatchHistory, removeFromHistory, clearAllHistory } from "../controllers/history.controller.js";

const router = express.Router();

router.post("/add/:mediaId/:mediaType", verifyToken, addToHistory)
router.get("/", verifyToken, getWatchHistory);
router.delete("/remove/:mediaId/:mediaType", verifyToken, removeFromHistory);
router.delete("/clear", verifyToken, clearAllHistory);

export default router;