import { Media } from "../models/media.model.js";
import cloudinary from "../configs/cloudinary.js";
import axios from "axios";

const createMedia = async (req, res) => {
    try {
        const { title, name, media_type, overview, release_date, first_air_date, genre_ids } = req.body;

        if (!media_type) {
            return res.status(400).json({ message: "media_type is required" });
        }

        let poster_path = "";
        let backdrop_path = "";

        if (req.files?.poster) {
            const posterUpload = await cloudinary.uploader.upload(
                req.files.poster[0].path,
                { folder: "movie-platform/posters" }
            );
            poster_path = posterUpload.secure_url;
        }

        if (req.files?.banner) {
            const bannerUpload = await cloudinary.uploader.upload(
                req.files.banner[0].path,
                { folder: "movie-platform/banners" }
            );
            backdrop_path = bannerUpload.secure_url;
        }

        const genres = genre_ids
            ? genre_ids.split(",").map((g) => Number(g.trim()))
            : [];

        const media = await Media.create({
            title,
            name,
            media_type,
            overview,
            poster_path,
            backdrop_path,
            release_date,
            first_air_date,
            genre_ids: genres
        });

        return res.status(201).json({
            message: "Media created successfully",
            media
        });

    } catch (error) {
        console.error("Create media error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const updateMedia = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { title, name, media_type, overview, release_date, first_air_date, genre_ids } = req.body;
        if (!mediaId) {
            return res.status(400).json({ message: "Media ID is required" });
        }

        const existingMedia = await Media.findOne({ _id: mediaId });
        if (!existingMedia) {
            return res.status(404).json({ message: "Media not found" });
        }

        const genres = genre_ids ? genre_ids.split(",").map((g) => Number(g.trim())) : existingMedia.genre_ids;

        existingMedia.title = title || existingMedia.title;
        existingMedia.name = name || existingMedia.name;
        existingMedia.media_type = media_type || existingMedia.media_type;
        existingMedia.overview = overview || existingMedia.overview;
        existingMedia.release_date = release_date || existingMedia.release_date;
        existingMedia.first_air_date = first_air_date || existingMedia.first_air_date;
        existingMedia.genre_ids = genres;

        if (req.files?.poster) {
            const posterUpload = await cloudinary.uploader.upload(
                req.files.poster[0].path,
                { folder: "movie-platform/posters" }
            );
            existingMedia.poster_path = posterUpload.secure_url;
        }

        if (req.files?.banner) {
            const bannerUpload = await cloudinary.uploader.upload(
                req.files.banner[0].path,
                { folder: "movie-platform/banners" }
            )
            existingMedia.backdrop_path = bannerUpload.secure_url;
        }

        await existingMedia.save();

        return res.status(200).json({
            message: "Media updated successfully",
            media: existingMedia
        });
    } catch (error) {
        console.error("Update media error:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

// ---------------------------------------- NON ADMIN -----------------------------------------

const fetchMedias = async (req, res) => {
    try {
        const medias = await Media.find({ isDeleted: false });
        return res.status(200).json({
            message: "Medias fetched successfully",
            count: medias.length,
            medias
        });
    } catch (error) {
        console.error("Fetch medias error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const getMediaById = async (req, res) => {
    try {
        const { mediaId } = req.params;
        if (!mediaId) return res.status(400).json({ message: "Media ID is required" });

        const media = await Media.findOne({ _id: mediaId, isDeleted: false });
        if (!media) return res.status(404).json({ message: "Media not found" });
        return res.status(200).json({
            message: "Media fetched successfully",
            media
        });
    } catch (error) {
        console.error("Get media by ID error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const deleteMedia = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only pls" })
        const { mediaId } = req.params;
        if (!mediaId) return res.status(400).json({ message: "Media ID is required" })

        const exists = await Media.findOne({ _id: mediaId }).select("isDeleted")
        if (!exists) return res.status(404).json({ message: "Media does not exists or has been deleted" })

        exists.isDeleted = !exists.isDeleted;

        await exists.save()

        return res.status(200).json({
            message: `Media is ${exists.isDeleted ? "deleted" : "visible"}`
        })
    } catch (error) {
        console.error("Failed to toggle media", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

const searchMedia = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ message: "Search query required" });
        }

        // 1. Search in your DB (admin media)
        const dbResults = await Media.find({
            isDeleted: false,
            $or: [
                { title: { $regex: q, $options: "i" } },
                { name: { $regex: q, $options: "i" } }
            ]
        });

        const formattedDbResults = dbResults.map((m) => ({
            id: m._id,
            title: m.title || m.name,
            name: m.name || m.title,
            overview: m.overview,
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            media_type: m.media_type,
            release_date: m.release_date,
            first_air_date: m.first_air_date,
            vote_average: m.vote_average,
            vote_count: m.vote_count,
            isAdmin: true
        }));

        // 2. Searchin data frot the TMDB API
        const tmdbResponse = await axios.get(
            `https://api.themoviedb.org/3/search/multi`,
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    query: q,
                    page
                }
            }
        );

        const tmdbResults = tmdbResponse.data.results.slice(0, 10);

        // 3. Merge results from the both API sources
        const results = [...formattedDbResults, ...tmdbResults];

        return res.status(200).json({
            message: "Search results fetched",
            count: results.length,
            results
        });

    } catch (error) {
        console.error("Search media error:", error);
        return res.status(500).json({ message: "Search media error" });
    }
};

const getTrailer = async (req, res) => {
    try {
        const { mediaId, mediaType } = req.params;

        if (!["movie", "tv"].includes(mediaType)) {
            return res.status(400).json({ message: "Invalid media type" });
        }

        const endpoint = `https://api.themoviedb.org/3/${mediaType}/${mediaId}/videos`;

        const response = await axios.get(endpoint, {
            params: {
                api_key: process.env.TMDB_API_KEY
            }
        });

        const trailer = response.data.results.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
        );

        if (!trailer) {
            return res.status(404).json({
                message: "Trailer not available"
            });
        }

        return res.json({
            key: trailer.key
        });

    } catch (error) {

        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Media not found on TMDB" });
        }

        console.error("Trailer fetch error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export {
    createMedia, //Admin Onli
    updateMedia, //Admin only
    fetchMedias,
    getMediaById,
    deleteMedia, //Admin only - Soft delete (toggle)
    searchMedia,
    getTrailer
};