import mongoose from "mongoose";

const favouriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mediaId: {
        type: Number,   // TMDB id
        required: true
    },
    mediaType: {
        type: String,
        enum: ["movie", "tv"],
        required: true
    }
}, { timestamps: true });

export const Favourite = mongoose.model("Favourite", favouriteSchema);