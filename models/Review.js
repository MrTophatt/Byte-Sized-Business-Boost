const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60   // short & punchy
    },

    body: {
        type: String,
        trim: true,
        maxlength: 1000
    },
},
{ timestamps: true });

// Prevent duplicate reviews
reviewSchema.index(
    { businessId: 1, userId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Review", reviewSchema);