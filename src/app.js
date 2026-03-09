import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import authRoutes from "./routes/auth.route.js"
import mediaRoutes from "./routes/media.route.js"
import favouriteRoutes from "./routes/favourite.route.js"
import historyRoutes from "./routes/history.route.js"
import adminRoutes from "./routes/admin.route.js"

dotenv.config()
const app = express()

// Middleware
app.use(express.json())


app.use(
    cors({
        origin: ["https://movie-hub-beta-ruddy.vercel.app", "http://localhost:5173"],
        credentials: true,
    })
);

// Routes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/media", mediaRoutes)
app.use("/api/v1/favourite", favouriteRoutes)
app.use("/api/v1/history", historyRoutes)
app.use("/api/v1/admin", adminRoutes)

export default app