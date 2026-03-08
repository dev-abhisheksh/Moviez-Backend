import express from "express"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.route.js"
import mediaRoutes from "./routes/media.route.js"
import favouriteRoutes from "./routes/favourite.route.js"

dotenv.config()
const app = express()

// Middleware
app.use(express.json())

// Routes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/media", mediaRoutes)
app.use("/api/v1/favourite", favouriteRoutes)

export default app