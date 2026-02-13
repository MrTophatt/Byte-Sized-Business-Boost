require("dotenv").config();
const mongoose = require("mongoose");
const { expect } = require("chai");
const request = require("supertest");
const app = require("../server"); // your Express app
const { connectDB, disconnectDB } = require("../database");
const User = require("../models/User");
const { Business } = require("../models/Business");
const googleClientId = process.env.GOOGLE_CLIENT_ID;

describe("Byte-Sized Business Boost Tests", function() {

    before(async function () {
        await connectDB();
    });

    after(async function () {
        await disconnectDB();
    });

    it("MongoDB connection should work", function() {
        expect(mongoose.connection.readyState).to.equal(1); // 1 = connected
    });

    it("User schema should create a guest user", async function() {
        const guest = await User.create({
            token: "123-234",
            role: "guest"
        });

        expect(guest.role).to.equal("guest");

        await User.deleteOne({ _id: guest._id }); // cleanup
    });

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

        await Business.deleteOne({ _id: business._id }); // cleanup
    });

    it("Google Client ID should be set", function() {
        expect(googleClientId).to.be.a("string");
        expect(googleClientId.length).to.be.greaterThan(0);
    });

    it("API should generate a guest user", async function() {
        const res = await request(app)
            .post("/api/users/generate")
            .send();

        expect(res.status).to.equal(200);
        expect(res.body.token).to.be.a("string");

        // cleanup
        await User.deleteOne({ token: res.body.token });
    });

    it("Login page should be reachable", async function() {
        const res = await request(app)
            .get("/login")
            .redirects(1);

        expect(res.status).to.equal(200);
        expect(res.text).to.include("g_id_onload");
        expect(res.text).to.include("Continue as Guest");
    });
});