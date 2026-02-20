/**
 * Express middleware that enforces authentication.
 * Verifies a user session token and attaches the user to the request object.
 */

const User = require("../models/User");

module.exports = async function (req, res, next) {
    // Read authentication token from custom request header
    const token = req.headers["x-user-token"];

    // If no token is provided, reject the request
    if (!token) {
        return res.status(401).json({ error: "No session" });
    }

    // If token is not a string, or less than 20 characters long, or longer than 128 characters, the session is invalid
    if (typeof token !== "string" || token.length < 20 || token.length > 128) {
        return res.status(401).json({ error: "Invalid session" });
    }

    // Attempt to find a user associated with this token
    const user = await User.findOne({ token });

    // If no user is found, the session is invalid
    if (!user) {
        return res.status(401).json({ error: "Invalid session" });
    }

    const now = new Date();

    // Session tokens must include an expiry and be still valid.
    if (!user.tokenExpiresAt || user.tokenExpiresAt <= now) {
        if (user.role === "guest") {
            await User.deleteOne({ _id: user._id });
        } else {
            user.token = null;
            user.tokenExpiresAt = null;
            await user.save();
        }

        return res.status(401).json({ error: "Session expired" });
    }

    // Guard for guest account lifetime until TTL cleanup runs in MongoDB.
    if (user.role === "guest" && user.guestExpiresAt && user.guestExpiresAt <= now) {
        await User.deleteOne({ _id: user._id });
        return res.status(401).json({ error: "Session expired" });
    }

    // Attach the authenticated user to the request object
    // This allows downstream handlers to access req.user
    req.user = user;

    // Continue to the next middleware or route handler
    next();
};