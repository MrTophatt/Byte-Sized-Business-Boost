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

    // Attempt to find a user associated with this token
    const user = await User.findOne({ token });

    // If no user is found, the session is invalid
    if (!user) {
        console.log("TEST no user");
        return res.status(401).json({ error: "Invalid session" });
    }

    // Attach the authenticated user to the request object
    // This allows downstream handlers to access req.user
    req.user = user;

    // Continue to the next middleware or route handler
    next();
};