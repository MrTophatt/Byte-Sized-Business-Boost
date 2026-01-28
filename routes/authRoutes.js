const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const crypto = require("crypto");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ googleId });

        if (!user) {
            user = await User.create({
                googleId,
                email,
                name,
                role: "user",
                token: crypto.randomUUID(),
                avatarUrl: picture // save Google avatar
            });
        } else {
            // Update session token only, keep avatarUrl
            user.token = crypto.randomUUID();
            await user.save();
        }

        res.json({ token: user.token });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Google login failed" });
    }
});

module.exports = router;