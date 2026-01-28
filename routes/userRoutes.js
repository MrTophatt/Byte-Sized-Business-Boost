const express = require("express");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/generate", async (req, res) => {
    try {
        const token = uuidv4();
        const user = await User.create({ token });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "User creation failed" });
    }
});

router.post("/logout", auth, async (req, res) => {
    try {
        if (req.user.role === "guest") {
            // Delete guest session from DB
            await User.deleteOne({ _id: req.user._id });
        } else {
            // Google user: keep account, just clear token
            req.user.token = null;
            await req.user.save();
        }

        res.json({ message: "Session ended" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Logout failed" });
    }
});

router.get("/me", auth, async (req, res) => {
    res.json(req.user);
});

router.get("/favourites", auth, async (req, res) => {
    const user = req.user;

    // Guests have no favourites
    if (user.role === "guest") {
        return res.json({ favourites: [] });
    }

    res.json({ favourites: user.favourites }); // array of business IDs
});

module.exports = router;
