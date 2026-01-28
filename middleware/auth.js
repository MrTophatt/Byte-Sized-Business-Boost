const User = require("../models/User");

module.exports = async function (req, res, next) {
    const token = req.headers["x-user-token"];

    if (!token) {
        return res.status(401).json({ error: "No session" });
    }

    const user = await User.findOne({ token });

    if (!user) {
        console.log("TEST no user")
        return res.status(401).json({ error: "Invalid session" });
    }

    req.user = user;
    next();
};