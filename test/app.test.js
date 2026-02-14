require("dotenv").config();
const mongoose = require("mongoose");
const { expect } = require("chai");
const request = require("supertest");

// Express app under test.
const app = require("../server");

// Database helpers used to open/close a shared test connection.
const { connectDB, disconnectDB } = require("../database");

// Mongoose models used in schema and endpoint tests.
const User = require("../models/User");
const { Business } = require("../models/Business");

// Read required environment values once at test load time.
const googleClientId = process.env.GOOGLE_CLIENT_ID;

describe("Byte-Sized Business Boost Tests", function() {

    // Connect to MongoDB once before running all tests in this file.
    before(async function () {
        await connectDB();
    });

    // Always close the DB connection so the test process exits cleanly.
    after(async function () {
        await disconnectDB();
    });

    describe("Database + schema checks", function() {
        // Sanity-check that the app is actually connected to MongoDB.
        it("MongoDB connection should work", function() {
            expect(mongoose.connection.readyState).to.equal(1); // 1 = connected
        });

        // Validate that the User model can create a guest account document.
        it("User schema should create a guest user", async function() {
            const guest = await User.create({
                token: "123-234",
                role: "guest"
            });

            expect(guest.role).to.equal("guest");

            // Cleanup keeps tests isolated and repeatable.
            await User.deleteOne({ _id: guest._id });
        });

        // Validate key Business schema behavior, including default fields.
        it("Business schema should create a test business", async function() {
            const business = await Business.create({
                name: "Test Coffee Shop",
                categories: ["food", "cafe"],
                rating: 4.5,
                deals: [{
                    title: "Welcome Offer",
                    description: "Free cookie with any coffee purchase",
                    startDate: new Date("2026-01-01"),
                    endDate: new Date("2026-01-31")
                }]
            });

            expect(business.name).to.equal("Test Coffee Shop");
            expect(business.categories).to.include("food");
            expect(business.timetable).to.have.lengthOf(7);
            expect(business.deals[0].title).to.equal("Welcome Offer");

            // Cleanup keeps test data from leaking across runs.
            await Business.deleteOne({ _id: business._id });
        });

        // Ensure the login page can safely render with OAuth config present.
        it("Google Client ID should be set", function() {
            expect(googleClientId).to.be.a("string");
            expect(googleClientId.length).to.be.greaterThan(0);
        });
    });

    describe("API and page route checks", function() {
        // Contract test for the guest-token generation endpoint.
        it("API should generate a guest user", async function() {
            const res = await request(app)
                .post("/api/users/generate")
                .send();

            expect(res.status).to.equal(200);
            expect(res.body.token).to.be.a("string");

            // Cleanup generated guest account to keep DB tidy.
            await User.deleteOne({ token: res.body.token });
        });

        // Smoke test for the index/dashboard static HTML entrypoint.
        it("Home page should be reachable", async function() {
            const res = await request(app)
                .get("/");

            expect(res.status).to.equal(200);
            expect(res.text).to.include("Byte-Sized Business Boost");
            expect(res.text).to.include("<footer class=\"site-footer\">");
        });

        // Login route currently redirects then renders an EJS page.
        it("Login page should be reachable", async function() {
            const res = await request(app)
                .get("/login")
                .redirects(1);

            expect(res.status).to.equal(200);
            expect(res.text).to.include("g_id_onload");
            expect(res.text).to.include("Continue as Guest");
        });

        // Profile route may first redirect because `express.static` sees `/public/profile`.
        // Follow one redirect to assert the final rendered profile page response.
        it("Profile page should be reachable", async function() {
            const res = await request(app)
                .get("/profile")
                .redirects(1);

            expect(res.status).to.equal(200);
            expect(res.text).to.include("Profile | Byte-Sized Business Boost");
        });

        // Business detail route should render and inject the requested business ID.
        it("Business details page should be reachable", async function() {
            const res = await request(app)
                .get("/business/test-business-id");

            expect(res.status).to.equal(200);
            expect(res.text).to.include("Business | Byte-Sized Business Boost");
            expect(res.text).to.include('const BUSINESS_ID = "test-business-id";');
        });

        // Unknown routes should return a 404 to avoid accidental silent success.
        it("Unknown routes should return 404", async function() {
            const res = await request(app)
                .get("/definitely-not-a-real-route");

            expect(res.status).to.equal(404);
        });
    });
});