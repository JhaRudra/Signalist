const mongoose = require("mongoose");

const WatchlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    stock: {
        type: String,
        required: true
    },
    signal: {
        type: String,
        default: "Watch"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Watchlist", WatchlistSchema);