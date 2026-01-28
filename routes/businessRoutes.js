const express = require("express");
const router = express.Router();
const { Business } = require("../models/Business");
const Review = require("../models/Review");

router.get("/", async (req, res) => {
    try {
        const businesses = await Business.aggregate([
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "businessId",
                    as: "reviews"
                }
            },
            {
                $addFields: {
                    reviewCount: { $size: "$reviews" },
                    avgRating: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $avg: "$reviews.rating" },
                            0
                        ]
                    }
                }
            },
            {
                $project: {
                    reviews: 0 // don't send review documents
                }
            }
        ]);

        // Round ratings for UI consistency
        businesses.forEach(b => {
            b.avgRating = Number(b.avgRating.toFixed(1));
        });

        res.json(businesses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch businesses" });
    }
});

module.exports = router;