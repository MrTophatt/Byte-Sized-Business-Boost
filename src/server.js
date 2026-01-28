require("dotenv").config();
const express = require("express");
const { connectDB } = require("./database");
const { Business } = require("../models/Business");
const Review = require("../models/Review");
const path = require("path");
const mongoose = require("mongoose");

const authRoutes = require("../routes/authRoutes");
const userRoutes = require("../routes/userRoutes");
const businessRoutes = require("../routes/businessRoutes");
const favouritesRoutes = require("../routes/favouritesRoutes")
const categoriesRoute = require("../routes/categoriesRoutes")
const reviewRoutes = require("../routes/reviewsRoutes");

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // folder for .ejs files

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/favourites", favouritesRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api/reviews", reviewRoutes);

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index/index.html"));
});

app.get("/login", (req, res) => {
    res.render("login", { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID });
});

app.get("/api/business/:id", async (req, res) => {
    try {
        const businessId = new mongoose.Types.ObjectId(req.params.id);

        const business = await Business.findById(businessId).lean();
        if (!business) {
            return res.status(404).json({ error: "Business not found" });
        }

        const stats = await Review.aggregate([
            { $match: { businessId } },
            {
                $group: {
                    _id: "$businessId",
                    avgRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        business.avgRating = stats.length
            ? Number(stats[0].avgRating.toFixed(1))
            : 0;

        business.reviewCount = stats.length
            ? stats[0].reviewCount
            : 0;

        res.json(business);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Invalid business ID" });
    }
});

app.get("/api/business/:id/favourite", async (req, res) => {
    console.log(req.user)
    if (!req.session.user || req.session.user.isGuest) {
        return res.json({ favourited: false });
    }

    const user = await User.findById(req.session.user.id);
    res.json({
        favourited: user.favourites.includes(req.params.id)
    });
});
app.post("/api/business/:id/favourite", async (req, res) => {
    if (!req.session.user || req.session.user.isGuest) {
        return res.status(403).json({ error: "Guests cannot favourite" });
    }

    const user = await User.findById(req.session.user.id);
    const id = req.params.id;

    if (user.favourites.includes(id)) {
        user.favourites.pull(id);
    } else {
        user.favourites.push(id);
    }

    await user.save();
    res.json({ success: true });
});

app.get("/business/:id", (req, res) => {
    res.render("business", { businessId: req.params.id });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

if (require.main === module) {
    connectDB().then(() => {
        const PORT = process.env.PORT;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

module.exports = app;