const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const { Business } = require("../models/Business");

/* ================================
   POST a review
================================ */
router.post("/:businessId", auth, async (req, res) => {
    try {
        const user = req.user;
        const { businessId } = req.params;
        const { title, body = "", rating } = req.body;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (user.role === "guest") {
            return res.status(403).json({ error: "Guest users cannot post reviews" });
        }

        if (!mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({ error: "Invalid business ID" });
        }

        const businessExists = await Business.exists({ _id: businessId });
        if (!businessExists) {
            return res.status(404).json({ error: "Business not found" });
        }

        const normalizedTitle = typeof title === "string" ? title.trim() : "";
        const normalizedBody = typeof body === "string" ? body.trim() : "";
        const normalizedRating = Number.parseInt(rating, 10);

        if (!normalizedTitle) {
            return res.status(400).json({ error: "Review title is required" });
        }

        if (normalizedTitle.length > 60) {
            return res.status(400).json({ error: "Review title must be 60 characters or fewer" });
        }

        if (normalizedBody.length > 1000) {
            return res.status(400).json({ error: "Review body must be 1000 characters or fewer" });
        }

        if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
            return res.status(400).json({ error: "Valid rating is required" });
        }

        const existing = await Review.findOne({ businessId, userId: user._id }).lean();
        if (existing) {
            return res.status(409).json({
                error: "You have already reviewed this business"
            });
        }

        const review = await Review.create({
            businessId,
            userId: user._id,
            title: normalizedTitle,
            body: normalizedBody,
            rating: normalizedRating
        });

        res.status(201).json(review);

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                error: "You have already reviewed this business"
            });
        }

        console.error(err);
        res.status(500).json({ error: "Failed to post review" });
    }
});

/* ================================
   GET reviews for current user
================================ */
router.get("/me", auth, async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate("businessId", "name")
            .lean();

        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            title: review.title,
            body: review.body,
            rating: review.rating,
            createdAt: review.createdAt,
            business: review.businessId
                ? { _id: review.businessId._id, name: review.businessId.name }
                : null
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load user reviews" });
    }
});


/* ================================
   GET reviews for a specific user
================================ */
router.get("/user/:userId", auth, async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate("businessId", "name")
            .lean();

        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            title: review.title,
            body: review.body,
            rating: review.rating,
            createdAt: review.createdAt,
            business: review.businessId
                ? { _id: review.businessId._id, name: review.businessId.name }
                : null
        }));

        res.json(formattedReviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load user reviews" });
    }
});

/* ================================
   GET reviews for a business
================================ */
router.get("/:businessId", async (req, res) => {
    try {
        const { businessId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(businessId)) {
            return res.status(400).json({ error: "Invalid business ID" });
        }

        // Fetch reviews and populate the user info
        const reviews = await Review.find({ businessId })
            .sort({ createdAt: -1 })
            .populate("userId", "name avatarUrl role"); // Only get needed fields

        // Transform reviews to include user info in a friendly format
        const formattedReviews = reviews.map(r => ({
            _id: r._id,
            title: r.title,
            body: r.body,
            rating: r.rating,
            createdAt: r.createdAt,
            user: {
                _id: r.userId._id,
                name: r.userId.name,
                avatarUrl: r.userId.avatarUrl,
                role: r.userId.role
            }
        }));

        res.json(formattedReviews);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load reviews" });
    }
});

module.exports = router;