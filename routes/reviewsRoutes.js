const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");

/* ================================
   GET reviews for a business
================================ */
router.get("/:businessId", async (req, res) => {
    try {
        const { businessId } = req.params;

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

/* ================================
   POST a review
================================ */
router.post("/:businessId", auth, async (req, res) => {
    try {
        const user = req.user;
        const { businessId } = req.params;
        const { title, body = "", rating } = req.body;

        // ---- AUTHORIZATION ----
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Prevent guest users from posting reviews
        if (user.role === "guest") {
            return res.status(403).json({ error: "Guest users cannot post reviews" });
        }

        // ---- Validation ----
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ error: "Review title is required" });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: "Valid rating is required" });
        }

        // ---- One review per user (soft check) ----
        const existing = await Review.findOne({ businessId, userId: user._id });
        if (existing) {
            return res.status(409).json({
                error: "You have already reviewed this business"
            });
        }

        // ---- Create review ----
        const review = await Review.create({
            businessId,
            userId: user._id,
            title: title.trim(),
            body: body.trim(),
            rating
        });

        res.status(201).json(review);

    } catch (err) {
        // Catch unique index violation (hard fail-safe)
        if (err.code === 11000) {
            return res.status(409).json({
                error: "You have already reviewed this business"
            });
        }

        console.error(err);
        res.status(500).json({ error: "Failed to post review" });
    }
});

module.exports = router;