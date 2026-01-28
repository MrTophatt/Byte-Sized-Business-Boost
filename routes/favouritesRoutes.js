const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Check if the business is favourited
router.get("/:businessId", auth, async (req, res) => {
    const user = req.user;

    // Guests cannot favourite
    if (user.role === "guest") {
        return res.json({ favourited: false });
    }

    const favourited = user.favourites.includes(req.params.businessId);
    res.json({ favourited });
});

// Toggle favourite
router.post("/:businessId", auth, async (req, res) => {
    const user = req.user;

    if (user.role === "guest") {
        return res.status(403).json({ error: "Guests cannot favourite" });
    }

    const id = req.params.businessId;

    if (user.favourites.includes(id)) {
        user.favourites.pull(id);
    } else {
        user.favourites.push(id);
    }

    await user.save();
    res.json({ success: true, favourited: user.favourites.includes(id) });
});

module.exports = router;