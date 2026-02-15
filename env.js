/**
 * env.js: environment loading helper that populates process.env before configuration is read.
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

let loaded = false;
/**
 * Loads environment variables from the first available .env file so config is ready before app startup.
 */
function loadEnv() {
    if (loaded) return;

    const candidates = [
        path.join(process.cwd(), ".env"),
        path.join(__dirname, ".env"),
        process.resourcesPath ? path.join(process.resourcesPath, ".env") : null
    ].filter(Boolean);

    for (const envPath of candidates) {
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
            loaded = true;
            return;
        }
    }

    dotenv.config();
    loaded = true;
}

module.exports = { loadEnv };