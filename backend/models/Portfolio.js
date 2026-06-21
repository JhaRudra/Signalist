const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema({
  stock: String,
  quantity: Number,
  buyPrice: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);