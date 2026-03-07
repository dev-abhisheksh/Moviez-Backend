import { Favourite } from "../models/favourite.model";

const toggleFavourite = async (req, res) => {
    try {
        const { mediaId, mediaType } = req.params;
        const user = req.user;
        if (!mediaId || !mediaType) return res.status(400).json({ message: "Media ID and type are required" });

        const existing = await Favourite.findOne({ userId: user._id, mediaId, mediaType });

        if (existing) {
            await Favourite.deleteOne({ _id: existing._id });
            return res.json({ message: "Removed from favourites" });
        }

        const favourite = await Favourite.create({
            userId: user._id,
            mediaId,
            mediaType
        });
        return res.json({ message: "Added to favourites", favourite });
    } catch (error) {
        console.error("Favourite error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const getFavourites = async (req, res) => {
    try {
        const userId = req.user._id;
        const favourites = await Favourite.find({ userId }).sort({ createdAt: -1 });
        return res.json({ favourites });
    } catch (error) {
        console.error("Get favourites error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const checkFavoriteStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { mediaId, mediaType } = req.params;

        const favourite = await Favourite.findOne({
            userId,
            mediaId,
            mediaType
        });

        res.status(200).json({
            isFavourite: !!favourite
        });

    } catch (error) {
        console.error("Check favourite status error", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export {
    toggleFavourite,
    getFavourites,
    checkFavoriteStatus
}