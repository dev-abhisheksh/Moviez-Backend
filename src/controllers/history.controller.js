import { History } from "../models/history.model.js";

const addToHistory = async (req, res) => {
    try {
        const { mediaId, mediaType } = req.params;
        const userId = req.user._id;
        if (!mediaId || !mediaType) return res.status(400).json({ message: "Media ID and type are required" });

        const existing = await History.findOne({ userId, mediaId, mediaType });
        if (existing) {
            existing.watchedAt = new Date();
            await existing.save();
            return res.json({ message: "History updated", history: existing });
        }

        const history = await History.create({
            userId,
            mediaId,
            mediaType,
            watchedAt: new Date()
        });

        return res.json({ message: "History added", history });

    } catch (error) {
        console.error("Add to history error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


const getWatchHistory = async (req, res) => {
    try {
        const histories = await History.find({ userId: req.user._id }).sort({ watchedAt: -1 })
        if (histories.length === 0) return res.status(200).json({
            message: "Fetched your history",
            count: 0,
            histories
        })

        return res.status(200).json({
            message: "Fetched your history",
            count: histories.length,
            histories
        })
    } catch (error) {
        console.error("Get watch history error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const removeFromHistory = async (req, res) => {
    try {
        const { mediaId, mediaType } = req.params;
        const userId = req.user.id;
        if (!mediaId || !mediaType) return res.status(400).json({ message: "Media ID and type are required" });

        await History.deleteOne({ userId, mediaId, mediaType });
        return res.json({ message: "Removed from history" });
    } catch (error) {
        console.error("Remove from history error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export {
    addToHistory,
    getWatchHistory,
    removeFromHistory
}