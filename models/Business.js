const mongoose = require("mongoose");

const BUSINESS_CATEGORIES = {
    food: "bi-egg-fried",
    cafe: "bi-cup-hot",
    retail: "bi-bag",
    services: "bi-tools",
    health: "bi-heart-pulse",
    education: "bi-mortarboard",
    entertainment: "bi-controller",
    technology: "bi-cpu",
    fitness: "bi-activity"
};

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,

    categories: {
        type: [String],
        enum: Object.keys(BUSINESS_CATEGORIES),
        required: true
    },

    deals: [String],

    imageUrl: {
        type: String,
        default: "/images/defaultBusiness.png"
    }
});

module.exports = {
    Business: mongoose.model("Business", businessSchema),
    BUSINESS_CATEGORIES
};