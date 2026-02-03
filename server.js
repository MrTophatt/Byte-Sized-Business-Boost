require("dotenv").config();
const express = require("express");
const { connectDB } = require("./database");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const businessRoutes = require("./routes/businessRoutes");
const favouritesRoutes = require("./routes/favouritesRoutes");
const categoriesRoute = require("./routes/categoriesRoutes");
const reviewRoutes = require("./routes/reviewsRoutes");

const PORT = process.env.PORT;

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // folder for .ejs files

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/favourites", favouritesRoutes);
app.use("/api/categories", categoriesRoute);
app.use("/api/reviews", reviewRoutes);

app.get("/", async (req, res) => {
    res.sendFile(path.join(__dirname, "public/index/index.html"));
});

app.get("/login", (req, res) => {
    res.render("login", { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID });
});

app.get("/business/:id", (req, res) => {
    res.render("business", { businessId: req.params.id });
});

if (require.main === module) {
    connectDB().then(() => {
        const PORT = process.env.PORT;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

module.exports = app;