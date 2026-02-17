const mongoose = require("mongoose");

/**
 * User schema.
 * Supports both guest users and authenticated users.
 */
const userSchema = new mongoose.Schema({
    /**
     * Session token used for authentication.
     * Generated using UUIDv4 and stored client-side.
     */
    token: {
        type: String,
        index: true,
        unique: true,
        sparse: true
    },

    // User access level
    role: {
        type: String,
        enum: ["guest", "user"],
        default: "guest"
    },

    // OAuth / account information
    googleId: String,
    email: String,
    name: String,
    avatarUrl: String,

    /**
     * Businesses favourited by the user.
     * Stored as references for fast lookup.
     */
    favourites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business"
    }],

    // Account creation timestamp
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);