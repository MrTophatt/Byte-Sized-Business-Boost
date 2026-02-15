/**
 * database.js: MongoDB connection helpers used by the app startup, tests, and shutdown flows.
 */

const { loadEnv } = require("./env");
loadEnv();
const mongoose = require("mongoose");

/**
 * Connects to the MongoDB server.
 */
async function connectDB() {
    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
}
/**
 * Disconnects from the MongoDB server.
 */
async function disconnectDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
    }
}

module.exports = { connectDB, disconnectDB };