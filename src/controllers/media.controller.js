import { Media } from "../models/media.model.js";
import cloudinary from "../configs/cloudinary.js";

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

export { createMedia };