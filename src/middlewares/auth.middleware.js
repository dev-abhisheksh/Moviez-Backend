import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select(
      "_id role isBanned banExpiresAt banReason"
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (user.isBanned && (!user.banExpiresAt || user.banExpiresAt > new Date())) {
      return res.status(403).json({
        message: `Account banned: ${user.banReason || "Violation of platform rules"}`
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Token error", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default verifyToken;