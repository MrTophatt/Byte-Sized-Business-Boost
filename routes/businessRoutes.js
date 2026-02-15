const express = require("express");
const router = express.Router();
const { Types } = require("mongoose");
const { Business } = require("../models/Business");
const Review = require("../models/Review");
const User = require("../models/User");

function getBusinessInitials(name = "") {
    const parts = String(name)
        .trim()
        .split(/\s+/)
        .map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
        .filter(Boolean);

    if (!parts.length) {
        return "B";
    }

    return parts
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
        .slice(0, 4);
}

function getBackgroundColorFromName(name = "") {
    let hash = 0;

    for (const char of String(name)) {
        hash = ((hash << 5) - hash) + char.charCodeAt(0);
        hash |= 0;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 72%, 44%)`;
}

function createDefaultBusinessLogoDataUri(name = "") {
    const initials = getBusinessInitials(name);
    const backgroundColor = getBackgroundColorFromName(name);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${initials} logo">
        <rect width="128" height="128" rx="28" fill="${backgroundColor}"/>
        <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="48" font-family="Inter, Segoe UI, Roboto, Arial, sans-serif" font-weight="700" letter-spacing="1">${initials}</text>
        </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function withDefaultLogo(business) {
    const logoPath = business.logoImageUrl || "";
    const isMissingLogo = !logoPath
        || logoPath.includes("/images/defaultBusiness.png")
        || logoPath.includes("defaultBusiness.png");

    if (!isMissingLogo) {
        return business;
    }

    return {
        ...business,
        logoImageUrl: createDefaultBusinessLogoDataUri(business.name)
    };
}

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

        res.json(businesses.map(withDefaultLogo));
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

        res.json(businesses.map(withDefaultLogo));
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Invalid business ID" });
    }
});

module.exports = router;