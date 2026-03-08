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

        const banExpiresAt = durationHours
            ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
            : null;

        const user = await User.findByIdAndUpdate(
            userId,
            {
                isBanned: true,
                banReason: reason || "Violation of platform rules",
                bannedAt: new Date(),
                banExpiresAt
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            message: "User banned successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export {
    getAllUsers,
    banUser
}