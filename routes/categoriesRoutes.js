const express = require("express");
const router = express.Router();
const { BUSINESS_CATEGORIES } = require("../models/Business");

router.get("/", (req, res) => {
    const categories = Object.entries(BUSINESS_CATEGORIES).map(([key, icon]) => ({
        value: key,
        icon
    }));

    res.json(categories);
});

module.exports = router;