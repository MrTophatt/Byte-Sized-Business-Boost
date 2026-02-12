const { loadEnv } = require("./env");
loadEnv();
const express = require("express");
const { connectDB } = require("./database");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const businessRoutes = require("./routes/businessRoutes");
const favouritesRoutes = require("./routes/favouritesRoutes");
const categoriesRoute = require("./routes/categoriesRoutes");
const reviewRoutes = require("./routes/reviewsRoutes");

const app = express();
const publicDir = path.join(__dirname, "public");

app.use(express.json());
app.use(express.static(publicDir));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/favourites", favouritesRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api/reviews", reviewRoutes);

app.get("/", async (req, res) => {
    res.sendFile(path.join(publicDir, "index/index.html"));
});

app.get("/login", (req, res) => {
    res.render("login", { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID });
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.get("/business/:id", (req, res) => {
    res.render("business", { businessId: req.params.id });
});

async function startServer({ port = process.env.PORT, host = "0.0.0.0" } = {}) {
    await connectDB();

    return new Promise((resolve, reject) => {
        const server = app
            .listen(port, host, () => {
                const address = server.address();
                const activePort = typeof address === "object" && address ? address.port : port;

                resolve({
                    port: activePort,
                    close: () => new Promise((done, fail) => server.close(err => (err ? fail(err) : done())))
                });
            })
            .on("error", reject);
    });
}

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

module.exports = app;
module.exports.startServer = startServer;