import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import { checkFavouriteStatus, getFavourites, toggleFavourite } from "../controllers/favourite.controller.js";

const router = express.Router();

router.post("/add/:mediaId/:mediaType", verifyToken, toggleFavourite)
router.get("/", verifyToken, getFavourites);
router.get("/status/:mediaId/:mediaType", verifyToken, checkFavouriteStatus)

export default router;