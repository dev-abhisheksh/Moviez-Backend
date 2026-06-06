import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const tmdbApi = axios.create({
    baseURL: 'https://api.themoviedb.org/3',
    params: {
        api_key: process.env.TMDB_API_KEY,
    },
    timeout: 10000, // 10 seconds timeout
});

// Force IPv4 if needed (helps with some ETIMEDOUT issues in Node.js)
tmdbApi.defaults.family = 4;

export default tmdbApi;
