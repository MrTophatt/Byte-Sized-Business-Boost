/**
 * database.js: MongoDB connection helpers used by the app startup, tests, and shutdown flows.
 */

const { loadEnv } = require("../env");
loadEnv();
const mongoose = require("mongoose");
const { migrateLegacyUsers } = require("./userSchemaMigration");

/**
 * Connects to the MongoDB server.
 */
async function connectDB() {
    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(process.env.MONGODB_URI);
    await migrateLegacyUsers();
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