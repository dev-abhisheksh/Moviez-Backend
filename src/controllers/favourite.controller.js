import { Favourite } from "../models/favourite.model.js";
import axios from "axios";
import mongoose from "mongoose";
import { Media } from "../models/media.model.js";

const toggleFavourite = async (req, res) => {
    try {
        const { mediaId, mediaType } = req.params;
        const userId = req.user._id;

        if (!mediaId || !mediaType) {
            return res.status(400).json({ message: "Media ID and type are required" });
        }

        if (!["movie", "tv"].includes(mediaType)) {
            return res.status(400).json({ message: "Invalid media type" });
        }

        // Always compare as string
        const mediaIdStr = String(mediaId);

        // Check if already favourited
        const existing = await Favourite.findOne({ userId, mediaId: mediaIdStr, mediaType });

        if (existing) {
            await Favourite.deleteOne({ _id: existing._id });
            return res.json({ message: "Removed from favourites", isFavourite: false });
        }

        // Fetch metadata so My List page can render without re-fetching
        let title = "";
        let poster_path = "";
        let vote_average = 0;
        let isAdmin = false;

        // Check if it's a local MongoDB ID
        if (mongoose.Types.ObjectId.isValid(mediaIdStr) && mediaIdStr.length === 24) {
            const dbMedia = await Media.findById(mediaIdStr);
            if (dbMedia) {
                title = dbMedia.title || dbMedia.name || "";
                poster_path = dbMedia.poster_path || "";
                vote_average = dbMedia.vote_average || 0;
                isAdmin = true;
            }
        } else {
            // It's a TMDB ID — fetch basic info
            try {
                const tmdbRes = await axios.get(
                    `https://api.themoviedb.org/3/${mediaType}/${mediaIdStr}`,
                    { params: { api_key: process.env.TMDB_API_KEY } }
                );
                title = tmdbRes.data.title || tmdbRes.data.name || "";
                poster_path = tmdbRes.data.poster_path || "";
                vote_average = tmdbRes.data.vote_average || 0;
            } catch (tmdbErr) {
                console.error("TMDB fetch for favourite metadata failed:", tmdbErr.message);
            }
        }

        const favourite = await Favourite.create({
            userId,
            mediaId: mediaIdStr,
            mediaType,
            title,
            poster_path,
            vote_average,
            isAdmin
        });

        return res.status(201).json({
            message: "Added to favourites",
            isFavourite: true,
            favourite
        });

    } catch (error) {
        console.error("Favourite error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getFavourites = async (req, res) => {
    try {
        const userId = req.user._id;
        const favourites = await Favourite.find({ userId }).sort({ createdAt: -1 });

        // Format for frontend MovieCard/MovieGrid consumption
        const results = favourites.map(f => ({
            id: f.mediaId,
            _id: f.mediaId,
            title: f.title || "Untitled",
            poster_path: f.poster_path || "",
            media_type: f.mediaType,
            vote_average: f.vote_average || 0,
            isAdmin: f.isAdmin || false
        }));

        return res.json({ favourites: results });
    } catch (error) {
        console.error("Get favourites error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const checkFavouriteStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { mediaId, mediaType } = req.params;

        const mediaIdStr = String(mediaId);

        const favourite = await Favourite.findOne({
            userId,
            mediaId: mediaIdStr,
            mediaType
        });

        res.status(200).json({
            isFavourite: !!favourite
        });

    } catch (error) {
        console.error("Check favourite status error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export {
    toggleFavourite,
    getFavourites,
    checkFavouriteStatus
}