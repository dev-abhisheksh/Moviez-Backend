import mongoose from "mongoose";
import { Media } from "../models/media.model.js";
import cloudinary from "../configs/cloudinary.js";
import tmdbApi from "../configs/tmdb.js";

const extractYoutubeId = (url) => {
    if (!url) return '';
    // Match watch?v=ID, youtu.be/ID, embed/ID
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : url; // return as-is if already an ID or unrecognised format
};

const createMedia = async (req, res) => {
    try {
        const { title, name, media_type, overview, release_date, first_air_date, genre_ids, trailer_url, vote_average } = req.body;

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
            genre_ids: genres,
            trailer_url: extractYoutubeId(trailer_url),
            vote_average: vote_average ? Number(vote_average) : 0
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
        const { title, name, media_type, overview, release_date, first_air_date, genre_ids, trailer_url, vote_average } = req.body;
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
        if (trailer_url !== undefined) existingMedia.trailer_url = extractYoutubeId(trailer_url);
        if (vote_average !== undefined) existingMedia.vote_average = Number(vote_average);

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
        const { mediaId, mediaType } = req.params;
        if (!mediaId) return res.status(400).json({ message: "Media ID is required" });

        // Validate mediaType
        const validTypes = ['movie', 'tv', 'admin'];
        const type = validTypes.includes(mediaType) ? mediaType : 'movie';

        // Admin content: fetch from MongoDB
        if (type === 'admin' || (mongoose.Types.ObjectId.isValid(mediaId) && mediaId.length === 24)) {
            const media = await Media.findOne({ _id: mediaId, isDeleted: false });
            if (!media) return res.status(404).json({ message: "Media not found" });
            return res.status(200).json({
                message: "Media fetched successfully",
                media: {
                    ...media.toObject(),
                    id: media._id,
                    isAdmin: true,
                    trailer_url: media.trailer_url || ''
                }
            });
        }

        // TMDB content: use the correct type endpoint
        const tmdbResponse = await tmdbApi.get(`/${type}/${mediaId}`);

        const tmdbData = tmdbResponse.data;

        // Validate that the returned ID matches what was requested
        if (String(tmdbData.id) !== String(mediaId)) {
            return res.status(404).json({ message: "Media not found — ID mismatch" });
        }

        return res.status(200).json({
            message: "Media fetched successfully",
            media: {
                id: tmdbData.id,
                title: tmdbData.title || tmdbData.name,
                name: tmdbData.name || tmdbData.title,
                overview: tmdbData.overview,
                poster_path: tmdbData.poster_path,
                backdrop_path: tmdbData.backdrop_path,
                media_type: type,
                release_date: tmdbData.release_date,
                first_air_date: tmdbData.first_air_date,
                vote_average: tmdbData.vote_average,
                vote_count: tmdbData.vote_count,
                runtime: tmdbData.runtime || tmdbData.episode_run_time?.[0],
                tagline: tmdbData.tagline,
                status: tmdbData.status,
                genres: tmdbData.genres || [],
                number_of_seasons: tmdbData.number_of_seasons,
                number_of_episodes: tmdbData.number_of_episodes,
                seasons: (tmdbData.seasons || []).filter(s => s.season_number > 0).map(s => ({
                    id: s.id,
                    name: s.name,
                    season_number: s.season_number,
                    episode_count: s.episode_count,
                    air_date: s.air_date,
                    poster_path: s.poster_path,
                    overview: s.overview,
                })),
                isAdmin: false
            }
        });

    } catch (error) {
        console.error("Get media by ID error:", error);
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Media not found" });
        }
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
        const { q, page } = req.query;

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

        // 2. Search data from the TMDB API
        const tmdbResponse = await tmdbApi.get(`/search/multi`, {
            params: {
                query: q,
                page: page || 1
            }
        });

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

        const response = await tmdbApi.get(`/${mediaType}/${mediaId}/videos`);

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

const getTrending = async (req, res) => {
    try {
        const { type } = req.params;

        const tmdbResponse = await tmdbApi.get(`/trending/${type}/day`);

        const dbMedias = await Media.find({
            media_type: type,
            isDeleted: false
        }).limit(5).sort({ createdAt: -1 });

        const formattedDb = dbMedias.map(m => ({
            id: m._id,
            title: m.title || m.name,
            poster_path: m.poster_path,
            backdrop_path: m.backdrop_path,
            vote_average: m.vote_average,
            media_type: m.media_type,
            isAdmin: true
        }));

        const results = [...formattedDb, ...tmdbResponse.data.results];

        return res.status(200).json({
            success: true,
            results
        });

    } catch (error) {
        console.error("Trending fetch error:", error);
        return res.status(500).json({ message: "Failed to fetch trending" });
    }
};

const getCredits = async (req, res) => {
    try {
        const { mediaType, mediaId } = req.params;

        if (!["movie", "tv"].includes(mediaType)) {
            return res.status(400).json({ message: "Invalid media type" });
        }

        const response = await tmdbApi.get(`/${mediaType}/${mediaId}/credits`);

        const cast = (response.data.cast || []).slice(0, 12).map((actor) => ({
            id: actor.id,
            name: actor.name,
            character: actor.character,
            profile_path: actor.profile_path,
        }));

        return res.json({ cast });
    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Credits not found" });
        }
        console.error("Credits fetch error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getRecommendations = async (req, res) => {
    try {
        const { mediaType, mediaId } = req.params;

        if (!["movie", "tv"].includes(mediaType)) {
            return res.status(400).json({ message: "Invalid media type" });
        }

        // Try TMDB recommendations first (based on audience behavior & metadata)
        let results = [];
        try {
            const recResponse = await tmdbApi.get(`/${mediaType}/${mediaId}/recommendations`, { params: { page: 1 } });
            results = recResponse.data.results || [];
        } catch (err) {
            console.warn("Recommendations endpoint failed, trying similar:", err.message);
        }

        // Fallback to TMDB "similar" if recommendations are empty
        if (results.length === 0) {
            try {
                const simResponse = await tmdbApi.get(`/${mediaType}/${mediaId}/similar`, { params: { page: 1 } });
                results = simResponse.data.results || [];
            } catch (err) {
                console.warn("Similar endpoint also failed:", err.message);
            }
        }

        // Format and filter: only items with poster & decent rating
        const formatted = results
            .filter(item => item.poster_path && (item.vote_average || 0) > 0)
            .slice(0, 20)
            .map(item => ({
                id: item.id,
                title: item.title || item.name,
                name: item.name || item.title,
                overview: item.overview,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                media_type: mediaType,
                release_date: item.release_date || item.first_air_date,
                vote_average: item.vote_average,
                genre_ids: item.genre_ids || [],
                isAdmin: false
            }));

        return res.status(200).json({
            success: true,
            results: formatted
        });

    } catch (error) {
        console.error("Recommendations fetch error:", error);
        return res.status(500).json({ message: "Failed to fetch recommendations" });
    }
};

const getAiringAnime = async (req, res) => {
    try {
        const { page } = req.query;

        // Use TMDB discover to find currently airing Japanese animation
        const tmdbResponse = await tmdbApi.get('/discover/tv', {
            params: {
                with_genres: 16,                    // Animation genre
                with_original_language: 'ja',       // Japanese
                sort_by: 'popularity.desc',
                'air_date.gte': new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
                with_status: '0',                   // Returning series
                page: page || 1,
            }
        });

        const results = (tmdbResponse.data.results || []).map(item => ({
            id: item.id,
            title: item.name,
            name: item.name,
            overview: item.overview,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            media_type: 'tv',
            release_date: item.first_air_date,
            first_air_date: item.first_air_date,
            vote_average: item.vote_average,
            vote_count: item.vote_count,
            genre_ids: item.genre_ids || [],
            isAdmin: false,
        }));

        return res.status(200).json({
            success: true,
            results,
            total_pages: tmdbResponse.data.total_pages,
            total_results: tmdbResponse.data.total_results,
        });

    } catch (error) {
        console.error("Airing anime fetch error:", error);
        return res.status(500).json({ message: "Failed to fetch airing anime" });
    }
};

const getSeasonEpisodes = async (req, res) => {
    try {
        const { tvId, seasonNumber } = req.params;

        const response = await tmdbApi.get(`/tv/${tvId}/season/${seasonNumber}`);

        const episodes = (response.data.episodes || []).map(ep => ({
            id: ep.id,
            name: ep.name,
            episode_number: ep.episode_number,
            season_number: ep.season_number,
            overview: ep.overview,
            still_path: ep.still_path,
            air_date: ep.air_date,
            runtime: ep.runtime,
            vote_average: ep.vote_average,
        }));

        return res.status(200).json({
            success: true,
            season_number: response.data.season_number,
            name: response.data.name,
            episodes,
        });
    } catch (error) {
        console.error("Season episodes fetch error:", error);
        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Season not found" });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
};

const discoverByGenre = async (req, res) => {
    try {
        const { genres, type = 'movie', page = 1, sort = 'popularity.desc' } = req.query;

        if (!genres) {
            return res.status(400).json({ message: "At least one genre ID is required" });
        }

        const validTypes = ['movie', 'tv'];
        const mediaType = validTypes.includes(type) ? type : 'movie';

        const tmdbResponse = await tmdbApi.get(`/discover/${mediaType}`, {
            params: {
                with_genres: genres, // comma-separated genre IDs
                sort_by: sort,
                page,
                'vote_count.gte': 10,
                include_adult: false,
            }
        });

        const results = (tmdbResponse.data.results || []).map(item => ({
            id: item.id,
            title: item.title || item.name,
            name: item.name || item.title,
            overview: item.overview,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            media_type: mediaType,
            release_date: item.release_date || item.first_air_date,
            first_air_date: item.first_air_date,
            vote_average: item.vote_average,
            vote_count: item.vote_count,
            genre_ids: item.genre_ids || [],
            isAdmin: false,
        }));

        return res.status(200).json({
            success: true,
            results,
            page: tmdbResponse.data.page,
            total_pages: tmdbResponse.data.total_pages,
            total_results: tmdbResponse.data.total_results,
        });
    } catch (error) {
        console.error("Discover by genre error:", error);
        return res.status(500).json({ message: "Failed to discover media by genre" });
    }
};

export {
    createMedia, //Admin Onli
    updateMedia, //Admin only
    fetchMedias,
    getMediaById,
    deleteMedia, //Admin only - Soft delete (toggle)
    searchMedia,
    getTrailer,
    getTrending,
    getCredits,
    getRecommendations,
    getAiringAnime,
    getSeasonEpisodes,
    discoverByGenre
};