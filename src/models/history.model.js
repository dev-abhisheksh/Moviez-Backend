import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
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
    // Store basic metadata so we can display history items without re-fetching
    title: String,
    poster_path: String,
    watchedAt: {
        type: Date,
        default: Date.now
    }
});

historySchema.index({ userId: 1, watchedAt: -1 });

export const History = mongoose.model("WatchHistory", historySchema);