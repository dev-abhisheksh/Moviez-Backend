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

        const user = await User.findByIdAndUpdate(
            userId,
            { isBanned: true },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            message: "User banned successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export {
    getAllUsers,
    banUser
}