import mongoose from "mongoose";

const favouriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mediaId: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ["movie", "tv"],
        required: true
    },
    // Store metadata so My List page can render without re-fetching
    title: String,
    poster_path: String,
    vote_average: Number,
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

favouriteSchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: true });

export const Favourite = mongoose.model("Favourite", favouriteSchema);