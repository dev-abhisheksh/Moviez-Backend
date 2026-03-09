import mongoose from "mongoose";
import { User } from "../models/user.model.js";

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");

        return res.json({
            count: users.length,
            users
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

const banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, durationHours } = req.body;

        if (req.user._id.toString() === userId) {
            return res.status(400).json({ message: "You cannot ban yourself" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (targetUser.role === "admin") {
            return res.status(403).json({ message: "Admins cannot be banned" });
        }

        const banExpiresAt = durationHours
            ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
            : null;

        targetUser.isBanned = true;
        targetUser.banReason = reason || "Violation of platform rules";
        targetUser.bannedAt = new Date();
        targetUser.banExpiresAt = banExpiresAt;

        await targetUser.save();

        const safeUser = targetUser.toObject();
        delete safeUser.password;

        return res.json({
            message: "User banned successfully",
            user: safeUser
        });

    } catch (error) {
        console.error("Ban user error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user._id.toString() === userId) {
            return res.status(400).json({ message: "You cannot delete yourself" });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (targetUser.role === "admin") {
            return res.status(403).json({ message: "Admins cannot be deleted" });
        }

        await User.findByIdAndDelete(userId);

        return res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export {
    getAllUsers,
    banUser,
    deleteUser
}