const express = require("express");
const router = express.Router();

// Predefined category mapping stored in the Business model
const { BUSINESS_CATEGORIES } = require("../models/Business");

/**
 * GET /api/categories
 * Returns all business categories and their associated icons.
 */
router.get("/", (req, res) => {

    // Convert category object into array format for frontend usage
    const categories = Object.entries(BUSINESS_CATEGORIES).map(
        ([key, icon]) => ({
            value: key,
            icon
        })
    );

    res.json(categories);
});

module.exports = router;