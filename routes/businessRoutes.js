const express = require("express");
const router = express.Router();
const { Types } = require("mongoose");
const { Business } = require("../models/Business");
const Review = require("../models/Review");
const User = require("../models/User");

router.get("/", async (req, res) => {
    try {
        const idsQuery = typeof req.query.ids === "string" ? req.query.ids : "";
        const requestedIds = idsQuery
            .split(",")
            .map((id) => id.trim())
            .filter((id) => Types.ObjectId.isValid(id));

        const pipeline = [];

        if (requestedIds.length) {
            const favouriteObjectIds = requestedIds.map((id) => new Types.ObjectId(id));

            pipeline.push(
                {
                    $match: {
                        _id: {
                            $in: favouriteObjectIds
                        }
                    }
                },
                {
                    $addFields: {
                        __sortOrder: {
                            $indexOfArray: [favouriteObjectIds, "$_id"]
                        }
                    }
                },
                { $sort: { __sortOrder: 1 } }
            );
        }

        const businesses = await Business.aggregate([
            ...pipeline,
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "businessId",
                    as: "reviews"
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { businessId: "$_id" },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: {
                                    $in: [
                                        "$$businessId",
                                        { $ifNull: ["$favourites", []] }
                                    ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "favouriteStats"
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
                    },
                    favouritesCount: {
                        $ifNull: [{ $arrayElemAt: ["$favouriteStats.count", 0] }, 0]
                    }
                }
            },
            {
                $project: {
                    reviews: 0,
                    favouriteStats: 0, // don't send review/favourite documents
                    __sortOrder: 0
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

router.get("/:id", async (req, res) => {
    try {
        const business = await Business.findById(req.params.id).lean();
        if (!business) {
            return res.status(404).json({ error: "Business not found" });
        }

        const [stats, favouritesCount] = await Promise.all([
            Review.aggregate([
                { $match: { businessId: business._id } },
                {
                    $group: {
                        _id: "$businessId",
                        avgRating: { $avg: "$rating" },
                        reviewCount: { $sum: 1 }
                    }
                }
            ]),
            User.countDocuments({ favourites: business._id })
        ]);

        business.avgRating = stats.length
            ? Number(stats[0].avgRating.toFixed(1))
            : 0;

        business.reviewCount = stats.length
            ? stats[0].reviewCount
            : 0;

        business.favouritesCount = favouritesCount;

        res.json(business);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Invalid business ID" });
    }
});

module.exports = router;