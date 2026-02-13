const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    token: String,

    role: {
        type: String,
        enum: ["guest", "user"],
        default: "guest"
    },

    googleId: String,
    email: String,
    name: String,
    avatarUrl: String,

    
    favourites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business"
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);