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

    /**
     * Token expiry timestamp. Sessions become invalid after this moment.
     */
    tokenExpiresAt: {
        type: Date,
        default: null,
        index: true
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
     * Guests are temporary accounts. This timestamp is used by a TTL index
     * so MongoDB automatically removes guests after their 24-hour lifetime.
     */
    guestExpiresAt: {
        type: Date,
        default: null
    },

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

// Only guest accounts should be automatically deleted by TTL.
userSchema.index(
    { guestExpiresAt: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: { role: "guest" }
    }
);

module.exports = mongoose.model("User", userSchema);