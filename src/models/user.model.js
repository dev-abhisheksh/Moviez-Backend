import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String
    },
    banExpiresAt: {
        type: Date
    },
    bannedAt: {
        type: Date
    },
    
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);