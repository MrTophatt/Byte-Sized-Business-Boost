/**
 * Main Express server entry point.
 * Responsible for:
 * - Loading environment variables
 * - Connecting to the database
 * - Registering middleware and routes
 * - Starting and exporting the HTTP server
 */
const { loadEnv } = require("./env");
loadEnv(); // Load environment variables before anything else

const express = require("express");
const { connectDB } = require("./database");
const path = require("path");

// Route modules
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const businessRoutes = require("./routes/businessRoutes");
const favouritesRoutes = require("./routes/favouritesRoutes");
const categoriesRoute = require("./routes/categoriesRoutes");
const reviewRoutes = require("./routes/reviewsRoutes");

const app = express(); // Create the Express app instance
const publicDir = path.join(__dirname, "public"); // Directory that contains static frontend assets

app.use(express.json()); // Parse incoming JSON request bodies
app.use(express.static(publicDir)); // Serve static files (HTML, CSS, JS, images)

// Configure EJS templating
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -----------------------
// API ROUTES
// -----------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/favourites", favouritesRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api/reviews", reviewRoutes);

// -----------------------
// PAGE ROUTES
// -----------------------
app.get("/", async (req, res) => { // Main landing page
    res.sendFile(path.join(publicDir, "index/index.html"));
});

app.get("/login", (req, res) => { // Login page (injects OAuth client ID)
    res.render("login", {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
    });
});

app.get("/profile", (req, res) => { // User profile page
    res.render("profile");
});

app.get("/profile/:id", (req, res) => { // Other user profile pages
    res.render("profile");
});

app.get("/business/:id", (req, res) => { // Individual business page
    res.render("business", {
        businessId: req.params.id
    });
});

app.use((req, res) => { // Fallback 404 handler for any route that was not matched above
    // Keep API responses machine-readable for unmatched API URLs.
    if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ error: "Route not found" });
    }

    // Render the branded 404 page for browser navigation routes.
    return res.status(404).render("404");
});

/**
 * Starts the HTTP server after connecting to the database.
 *
 * Returns an object containing:
 * - The active port
 * - A close() function for graceful shutdown
 */
async function startServer({ port = process.env.PORT, host = "0.0.0.0" } = {}) {
    // Ensure database connection is established first
    await connectDB();

    return new Promise((resolve, reject) => {
        const server = app
            .listen(port, host, () => {
                const address = server.address();

                // Determine actual port (useful if port was auto-assigned)
                const activePort =
                    typeof address === "object" && address
                        ? address.port
                        : port;

                resolve({
                    port: activePort,

                    // Provide a close function for controlled shutdown
                    close: () =>
                        new Promise((done, fail) =>
                            server.close(err => (err ? fail(err) : done()))
                        )
                });
            })
            .on("error", reject);
    });
}

// If this file is run directly (not required by Electron)
if (require.main === module) {
    startServer({ port: process.env.PORT, host: "0.0.0.0" })
        .then(({ port }) => {
            console.log(`Server running on port ${port}`);
        })
        .catch(err => {
            console.error("Failed to start server", err);
            process.exit(1);
        });
}

// Export Express app for reuse (e.g., Electron)
module.exports = app;

// Export server bootstrap function explicitly
module.exports.startServer = startServer;