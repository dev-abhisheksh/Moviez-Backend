import express from "express";
import verifyToken from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/roles.middleware.js";
import { banUser, deleteUser, getAllUsers } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/users", verifyToken, authorizeRoles("admin"), getAllUsers);
router.patch("/ban/:userId", verifyToken, authorizeRoles("admin"), banUser);
router.delete("/users/:userId", verifyToken, authorizeRoles("admin"), deleteUser);

export default router;