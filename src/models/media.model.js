import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true },   // same as TMDB movie title
    name: String,                               // for TV shows
    media_type: { type: String, enum: ["movie", "tv"], required: true },

    overview: String,
    poster_path: String,
    backdrop_path: String,

    release_date: Date,       // movies
    first_air_date: Date,     // tv

    genre_ids: [Number],

    trailer_url: String,

    vote_average: { type: Number, default: 0 },
    vote_count: { type: Number, default: 0 },

    source: { type: String, default: "admin" } // helps frontend identify origin

}, { timestamps: true });

mediaSchema.index({ title: "text", name: "text" });

export const Media = mongoose.model("Media", mediaSchema);