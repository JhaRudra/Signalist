const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
    stock: String,
    price: String,
    signal: String,
    confidence: Number,
    reason: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Prediction", PredictionSchema);