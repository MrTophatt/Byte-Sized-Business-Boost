const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

/**
 * GET /favourites/:businessId
 * Checks whether the authenticated user has favourited a business.
 */
router.get("/:businessId", auth, async (req, res) => {
    const user = req.user;

    // Guest users cannot favourite businesses
    if (user.role === "guest") {
        return res.json({ favourited: false });
    }

    const favourited = user.favourites.includes(req.params.businessId);
    res.json({ favourited });
});

/**
 * POST /favourites/:businessId
 * Toggles favourite status for a business.
 */
router.post("/:businessId", auth, async (req, res) => {
    const user = req.user;

    // Prevent guests from modifying favourites
    if (user.role === "guest") {
        return res.status(403).json({ error: "Guests cannot favourite" });
    }

    const id = req.params.businessId;

    // Toggle favourite state
    if (user.favourites.includes(id)) {
        user.favourites.pull(id);
    } else {
        user.favourites.push(id);
    }

    await user.save();

    res.json({
        success: true,
        favourited: user.favourites.includes(id)
    });
});

module.exports = router;