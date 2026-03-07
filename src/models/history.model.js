import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mediaId: {
        type: Number,
        required: true
    },
    mediaType: {
        type: String,
        enum: ["movie", "tv"],
        required: true
    },
    watchedAt: {
        type: Date,
        default: Date.now
    }
});

export const History = mongoose.model("WatchHistory", historySchema);