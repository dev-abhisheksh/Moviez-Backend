import { History } from "../models/history.model.js";
import axios from "axios";
import mongoose from "mongoose";
import { Media } from "../models/media.model.js";

const addToHistory = async (req, res) => {
    try {
        const { mediaId, mediaType } = req.params;
        const userId = req.user._id;
        if (!mediaId || !mediaType) return res.status(400).json({ message: "Media ID and type are required" });

        // Check if already in history — just update timestamp
        const existing = await History.findOne({ userId, mediaId, mediaType });
        if (existing) {
            existing.watchedAt = new Date();
            await existing.save();
            return res.json({ message: "History updated", history: existing });
        }

        // Get metadata so we can store title & poster
        let title = "";
        let poster_path = "";

        // If it's a valid MongoDB ObjectId, look in our DB first
        if (mongoose.Types.ObjectId.isValid(mediaId) && mediaId.length === 24) {
            const dbMedia = await Media.findById(mediaId);
            if (dbMedia) {
                title = dbMedia.title || dbMedia.name || "";
                poster_path = dbMedia.poster_path || "";
            }
        } else {
            // It's a TMDB ID — fetch basic info from TMDB
            try {
                const tmdbRes = await axios.get(
                    `https://api.themoviedb.org/3/${mediaType}/${mediaId}`,
                    { params: { api_key: process.env.TMDB_API_KEY } }
                );
                title = tmdbRes.data.title || tmdbRes.data.name || "";
                poster_path = tmdbRes.data.poster_path || "";
            } catch (tmdbErr) {
                console.error("TMDB fetch for history metadata failed:", tmdbErr.message);
            }
        }

        const history = await History.create({
            userId,
            mediaId,
            mediaType,
            title,
            poster_path,
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

        // Format for frontend consumption (so MovieCard/MovieRow can render them)
        const results = histories.map(h => ({
            id: h.mediaId,
            _id: h.mediaId,
            title: h.title || "Untitled",
            poster_path: h.poster_path || "",
            media_type: h.mediaType,
            watchedAt: h.watchedAt
        }));

        return res.status(200).json({
            message: "Fetched your history",
            count: results.length,
            results
        })
    } catch (error) {
        console.error("Get watch history error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const removeFromHistory = async (req, res) => {
    try {
        const { mediaId, mediaType } = req.params;
        const userId = req.user._id;
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