const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const { Types } = require("mongoose");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /users/generate
 * Creates a guest user with a random session token.
 */
router.post("/generate", async (req, res) => {
    try {
        const token = crypto.randomUUID();
        const user = await User.create({ token, role: "guest" });
        res.json({ token: user.token, role: user.role, _id: user._id });
    } catch (err) {
        res.status(500).json({ error: "User creation failed" });
    }
});

/**
 * POST /users/logout
 * Ends the current session.
 */
router.post("/logout", auth, async (req, res) => {
    try {
        if (req.user.role === "guest") {
            // Remove guest accounts entirely
            await User.deleteOne({ _id: req.user._id });
        } else {
            // Invalidate session token for registered users
            req.user.token = null;
            await req.user.save();
        }

        res.json({ message: "Session ended" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Logout failed" });
    }
});

/**
 * GET /users/me
 * Returns the authenticated user's profile.
 */
router.get("/me", auth, async (req, res) => {
    res.json(req.user);
});

/**
 * GET /users/favourites
 * Returns the current user's favourite businesses.
 */
router.get("/favourites", auth, async (req, res) => {
    const user = req.user;

    // Guests have no favourites
    if (user.role === "guest") {
        return res.json({ favourites: [] });
    }

    res.json({ favourites: user.favourites }); // array of business IDs
});

/**
 * GET /users/:id
 * Returns a specified authenticated user's profile.
 */
router.get("/:id", auth, async (req, res) => {
    try {
        // Return a clean not-found response for invalid user IDs.
        if (!Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: "User not found" });
        }

        const targetUser = await User.findById(req.params.id).lean();

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const viewerIsTarget = String(req.user._id) === String(targetUser._id);

        res.json({
            _id: targetUser._id,
            role: targetUser.role,
            name: targetUser.name,
            email: viewerIsTarget ? targetUser.email : undefined,
            avatarUrl: targetUser.avatarUrl,
            favourites: Array.isArray(targetUser.favourites) ? targetUser.favourites : []
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load user profile" });
    }
});

module.exports = router;