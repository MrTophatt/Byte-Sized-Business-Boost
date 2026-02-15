const mongoose = require("mongoose");

/**
 * Review schema.
 * Represents a single user's review of a business.
 */
const reviewSchema = new mongoose.Schema({
    // Business being reviewed
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },

    // User who wrote the review
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Star rating (1–5)
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    // Short review headline
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },

    // Optional longer review text
    body: {
        type: String,
        trim: true,
        maxlength: 1000
    }
}, {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true
});

/**
 * Prevents users from submitting multiple reviews
 * for the same business.
 */
reviewSchema.index(
    { businessId: 1, userId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Review", reviewSchema);