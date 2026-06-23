const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");

const User = require("./models/User");
const Watchlist = require("./models/Watchlist");
const Prediction = require("./models/Prediction");
const Portfolio = require("./models/Portfolio");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ MongoDB Error:", err.message));

app.get("/", (req, res) => {
    res.send("Signalist Backend Running");
});

// AUTH MIDDLEWARE
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({ message: "Registration Successful" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login Successful",
            token,
            name: user.name
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// AI PREDICTION
app.post("/api/predict", async (req, res) => {
    try {
        const { stock } = req.body;

        const aiResponse = await axios.post(
            "https://signalist-1.onrender.com/predict",
            { stock }
        );

        const prediction = aiResponse.data;

        const savedPrediction = new Prediction({
            stock: prediction.stock,
            price: prediction.price,
            signal: prediction.signal,
            confidence: prediction.confidence,
            reason: prediction.reason
        });

        await savedPrediction.save();

        res.json(prediction);

    } catch (error) {
        console.log(error.message);

        res.status(500).json({
            message: "AI prediction failed"
        });
    }
});

// PREDICTION HISTORY
app.get("/api/predictions", async (req, res) => {
    try {
        const predictions = await Prediction
            .find()
            .sort({ createdAt: -1 });

        res.json(predictions);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// WATCHLIST - USER SPECIFIC
app.post("/api/watchlist", verifyToken, async (req, res) => {
    try {
        const { stock, signal } = req.body;

        const item = new Watchlist({
            userId: req.user.id,
            stock,
            signal
        });

        await item.save();

        res.status(201).json({
            message: "Added to watchlist",
            item
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/api/watchlist", verifyToken, async (req, res) => {
    try {
        const items = await Watchlist
            .find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.json(items);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete("/api/watchlist/:id", verifyToken, async (req, res) => {
    try {
        await Watchlist.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        res.json({ message: "Removed from watchlist" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PORTFOLIO - BUY STOCK - USER SPECIFIC
app.post("/api/portfolio/buy", verifyToken, async (req, res) => {
    try {
        const { stock, quantity, price } = req.body;

        if (!stock || !quantity || !price) {
            return res.status(400).json({
                message: "Stock, quantity, and price are required"
            });
        }

        const item = new Portfolio({
            userId: req.user.id,
            stock: stock.toUpperCase(),
            quantity: Number(quantity),
            buyPrice: Number(price)
        });

        await item.save();

        res.status(201).json({
            message: "Stock purchased successfully",
            item
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PORTFOLIO - LIVE PROFIT/LOSS - USER SPECIFIC
app.get("/api/portfolio", verifyToken, async (req, res) => {
    try {
        const holdings = await Portfolio
            .find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        const updatedHoldings = [];

        for (const item of holdings) {
            const buyPrice = Number(item.buyPrice);
            const quantity = Number(item.quantity);
            let currentPrice = buyPrice;

            try {
                const aiResponse = await axios.post(
                    "https://signalist-1.onrender.com/predict",
                    { stock: item.stock }
                );

                currentPrice = Number(aiResponse.data.price);
            } catch (err) {
                console.log("Could not fetch live price for", item.stock);
            }

            const investedValue = Number((buyPrice * quantity).toFixed(2));
            const currentValue = Number((currentPrice * quantity).toFixed(2));
            const profitLoss = Number((currentValue - investedValue).toFixed(2));

            updatedHoldings.push({
                _id: item._id,
                stock: item.stock,
                quantity,
                buyPrice,
                currentPrice,
                investedValue,
                currentValue,
                profitLoss
            });
        }

        res.json(updatedHoldings);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PORTFOLIO - DELETE HOLDING - USER SPECIFIC
app.delete("/api/portfolio/:id", verifyToken, async (req, res) => {
    try {
        await Portfolio.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        res.json({ message: "Portfolio item removed" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ADMIN DASHBOARD STATS
app.get("/api/admin/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPredictions = await Prediction.countDocuments();
        const totalWatchlist = await Watchlist.countDocuments();
        const totalPortfolio = await Portfolio.countDocuments();

        res.json({
            totalUsers,
            totalPredictions,
            totalWatchlist,
            totalPortfolio
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});