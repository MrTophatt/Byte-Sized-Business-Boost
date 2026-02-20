require("dotenv").config();
process.env.NODE_ENV = "test";
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
const Review = require("../models/Review");

// Read required environment values once at test load time.
const googleClientId = process.env.GOOGLE_CLIENT_ID;

const oneWeekFromNow = () => new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
const oneDayFromNow = () => new Date(Date.now() + (24 * 60 * 60 * 1000));

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
                role: "guest",
                tokenExpiresAt: oneDayFromNow(),
                guestExpiresAt: oneDayFromNow()
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

        it("Signup page should be reachable", async function() {
            const res = await request(app)
                .get("/signup");

            expect(res.status).to.equal(200);
            expect(res.text).to.include("Create your account");
            expect(res.text).to.include("verificationModal");
        });
        it("Email signups get a random default avatar", async function() {
            const suffix = Date.now().toString(36);
            const username = `signup-${suffix}`;
            const email = `${username}@example.com`;
            const password = "Password123";

            const start = await request(app)
                .post("/api/auth/signup/start")
                .send({ username, email, password });

            expect(start.status).to.equal(200);
            expect(start.body.devVerificationCode).to.be.a("string");

            const verify = await request(app)
                .post("/api/auth/signup/verify")
                .send({ email, code: start.body.devVerificationCode });

            expect(verify.status).to.equal(200);
            expect(verify.body.token).to.be.a("string");

            const created = await User.findOne({ email }).lean();
            expect(created).to.exist;
            expect(created.role).to.equal("user");
            expect(created.avatarUrl).to.match(/^\/images\/default-avatars\/default-avatar-[1-3]\.svg$/);

            await User.deleteOne({ _id: created._id });
        });

        it("Generated guest users do not get a profile picture", async function() {
            const res = await request(app)
                .post("/api/users/generate")
                .send();

            expect(res.status).to.equal(200);

            const guest = await User.findOne({ token: res.body.token }).lean();
            expect(guest).to.exist;
            expect(guest.role).to.equal("guest");
            expect(guest.avatarUrl).to.not.exist;

            await User.deleteOne({ _id: guest._id });
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
        it("Unknown page routes should render the 404 page", async function() {
            const res = await request(app)
                .get("/definitely-not-a-real-route");

            expect(res.status).to.equal(404);
            expect(res.text).to.include("Page Not Found | Byte-Sized Business Boost");
            expect(res.text).to.include("We couldn't find that page.");
        });

        // Invalid business IDs should return not-found JSON instead of cast errors.
        it("Business API should return 404 for invalid business IDs", async function() {
            const res = await request(app)
                .get("/api/businesses/ag");

            expect(res.status).to.equal(404);
            expect(res.body.error).to.equal("Business not found");
        });

        // Invalid user profile IDs should resolve to a clean 404 response.
        it("User profile API should return 404 for invalid user IDs", async function() {
            const viewer = await User.create({
                token: `viewer-token-${Date.now()}-1234567890`,
                role: "user",
                googleId: `viewer-google-${Date.now()}`,
                email: `viewer-${Date.now()}@example.com`,
                name: "Viewer",
                tokenExpiresAt: oneWeekFromNow()
            });

            const res = await request(app)
                .get("/api/users/not-an-object-id")
                .set("x-user-token", viewer.token);

            expect(res.status).to.equal(404);
            expect(res.body.error).to.equal("User not found");

            await User.deleteOne({ _id: viewer._id });
        });

        // API consumers should receive structured JSON for unknown API URLs.
        it("Unknown API routes should return JSON 404", async function() {
            const res = await request(app)
                .get("/api/definitely-not-a-real-route");

            expect(res.status).to.equal(404);
            expect(res.body.error).to.equal("Route not found");
        });

        // Guard the bare `/api` path too (without a sub-route segment).
        it("Bare /api path should return JSON 404", async function() {
            const res = await request(app)
                .get("/api");

            expect(res.status).to.equal(404);
            expect(res.body.error).to.equal("Route not found");
        });
    });

    describe("Review security checks", function() {
        let business;
        let guestUser;
        let memberUser;

        beforeEach(async function() {
            const suffix = Date.now().toString(36);

            business = await Business.create({
                name: `Security Test Business ${suffix}`,
                categories: ["services"]
            });

            guestUser = await User.create({
                token: `guest-token-${suffix}-1234567890`,
                role: "guest",
                tokenExpiresAt: oneDayFromNow(),
                guestExpiresAt: oneDayFromNow()
            });
            memberUser = await User.create({
                token: `member-token-${suffix}-1234567890`,
                role: "user",
                googleId: `google-${suffix}`,
                email: `security-${suffix}@example.com`,
                name: "Security User",
                tokenExpiresAt: oneWeekFromNow()
            });
        });

        afterEach(async function() {
            await Review.deleteMany({ businessId: business._id });
            await User.deleteMany({ _id: { $in: [guestUser._id, memberUser._id] } });
            await Business.deleteOne({ _id: business._id });
        });

        it("Guests cannot post reviews", async function() {
            const res = await request(app)
                .post(`/api/reviews/${business._id}`)
                .set("x-user-token", guestUser.token)
                .send({ title: "Guest attempt", body: "Should fail", rating: 5 });

            expect(res.status).to.equal(403);
        });

        it("Enforces one review per user per business", async function() {
            const payload = { title: "Great place", body: "Nice service", rating: 4 };

            const first = await request(app)
                .post(`/api/reviews/${business._id}`)
                .set("x-user-token", memberUser.token)
                .send(payload);

            const second = await request(app)
                .post(`/api/reviews/${business._id}`)
                .set("x-user-token", memberUser.token)
                .send(payload);

            expect(first.status).to.equal(201);
            expect(second.status).to.equal(409);
        });

        it("Rejects review bodies over 1000 characters", async function() {
            const res = await request(app)
                .post(`/api/reviews/${business._id}`)
                .set("x-user-token", memberUser.token)
                .send({ title: "Long review", body: "x".repeat(1001), rating: 5 });

            expect(res.status).to.equal(400);
            expect(res.body.error).to.include("1000");
        });

        it("Rejects invalid business IDs for review posting", async function() {
            const res = await request(app)
                .post("/api/reviews/not-a-valid-id")
                .set("x-user-token", memberUser.token)
                .send({ title: "Bad business id", body: "Will fail", rating: 5 });

            expect(res.status).to.equal(400);
        });
    });

    describe("Session expiry checks", function() {
        it("Rejects expired member sessions and clears the stored token", async function() {
            const expiredUser = await User.create({
                token: `expired-member-${Date.now()}-1234567890`,
                role: "user",
                googleId: `expired-google-${Date.now()}`,
                email: `expired-${Date.now()}@example.com`,
                name: "Expired Member",
                tokenExpiresAt: new Date(Date.now() - 1000)
            });

            const res = await request(app)
                .get("/api/users/me")
                .set("x-user-token", expiredUser.token);

            expect(res.status).to.equal(401);
            expect(res.body.error).to.equal("Session expired");

            const reloaded = await User.findById(expiredUser._id).lean();
            expect(reloaded.token).to.equal(null);
            expect(reloaded.tokenExpiresAt).to.equal(null);

            await User.deleteOne({ _id: expiredUser._id });
        });

        it("Rejects expired guest sessions and deletes the guest account", async function() {
            const expiredGuest = await User.create({
                token: `expired-guest-${Date.now()}-1234567890`,
                role: "guest",
                tokenExpiresAt: new Date(Date.now() - 1000),
                guestExpiresAt: new Date(Date.now() - 1000)
            });

            const res = await request(app)
                .get("/api/users/me")
                .set("x-user-token", expiredGuest.token);

            expect(res.status).to.equal(401);
            expect(res.body.error).to.equal("Session expired");

            const reloaded = await User.findById(expiredGuest._id).lean();
            expect(reloaded).to.equal(null);
        });
    });
});