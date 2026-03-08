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
    }
}, { timestamps: true });

favouriteSchema.index({ userId: 1, mediaId: 1 });

export const Favourite = mongoose.model("Favourite", favouriteSchema);