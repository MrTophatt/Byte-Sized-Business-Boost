/**
 * database.js: MongoDB connection helpers used by the app startup, tests, and shutdown flows.
 */

const { loadEnv } = require("./env");
loadEnv();
const mongoose = require("mongoose");

async function migrateUserTokenIndex() {
    const db = mongoose.connection.db;

    if (!db) {
        return;
    }

    const usersCollection = db.collection("users");
    const indexes = await usersCollection.indexes();

    const tokenIndexes = indexes.filter(index => index?.key?.token === 1);

    if (tokenIndexes.length === 0) {
        await usersCollection.createIndex(
            { token: 1 },
            {
                name: "token_1",
                unique: true,
                partialFilterExpression: { token: { $type: "string" } }
            }
        );
        return;
    }

    for (const index of tokenIndexes) {
        const hasStringPartialFilter =
            index?.partialFilterExpression?.token?.$type === "string";

        if (index.name === "token_1" && index.unique === true && hasStringPartialFilter) {
            continue;
        }

        await usersCollection.dropIndex(index.name);
    }

    await usersCollection.createIndex(
        { token: 1 },
        {
            name: "token_1",
            unique: true,
            partialFilterExpression: { token: { $type: "string" } }
        }
    );
}

/**
 * Connects to the MongoDB server.
 */
async function connectDB() {
    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(process.env.MONGODB_URI);
    await migrateUserTokenIndex();
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