const express = require("express");
const router = express.Router();

// Google OAuth client used to verify Google ID tokens
const { OAuth2Client } = require("google-auth-library");

// User model used to find/create users in the database
const User = require("../models/User");

// Crypto module used to generate secure random session tokens
const crypto = require("crypto");

const USER_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

// Initialize Google OAuth client with the configured client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /auth/google
 * Handles Google OAuth login.
 * Verifies the Google ID token, then creates or updates a user record.
 */
router.post("/google", async (req, res) => {

    // Extract the Google ID token sent from the frontend
    const { token } = req.body;

    try {
        // Verify the Google ID token against Google's servers
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // Extract user information from the verified token
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!googleId || !email) {
            return res.status(400).json({ error: "Google login failed" });
        }

        const nextToken = crypto.randomUUID();
        const nextTokenExpiry = new Date(Date.now() + USER_SESSION_MS);

        // Attempt to find an existing user with this Google account
        let user = await User.findOne({ googleId });

        if (!user) {
            // If user does not exist, create a new account
            user = await User.create({
                googleId,
                email,
                name,
                role: "user",
                token: nextToken,
                tokenExpiresAt: nextTokenExpiry,
                avatarUrl: picture,
                guestExpiresAt: null
            });
        } else {
            // Existing user:
            // Generate a new session token without modifying profile data
            user.role = "user";
            user.token = nextToken;
            user.tokenExpiresAt = nextTokenExpiry;
            user.guestExpiresAt = null;
            await user.save();
        }

        // Send session token to the client
        res.json({ token: user.token });

    } catch (err) {
        // Duplicate key conflicts indicate account identity mismatch attempt
        if (err && err.code === 11000) {
            return res.status(409).json({ error: "Account conflict detected" });
        }

        // Any verification or database failure is treated as login failure
        console.error(err);
        res.status(400).json({ error: "Google login failed" });
    }
});

module.exports = router;