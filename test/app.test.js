require("dotenv").config();
const mongoose = require("mongoose");
const { expect } = require("chai");
const request = require("supertest");
const app = require("../server"); // your Express app
const { connectDB, disconnectDB } = require("../src/database");
const User = require("../models/User");
const { Business } = require("../models/Business");

// Example data
const testGoogleClientId = process.env.GOOGLE_CLIENT_ID;

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
            deals: ["Free cookie with coffee"]
        });

        expect(business.name).to.equal("Test Coffee Shop");
        expect(business.categories).to.include("food");

        await Business.deleteOne({ _id: business._id }); // cleanup
    });

    it("Google Client ID should be set", function() {
        expect(testGoogleClientId).to.be.a("string");
        expect(testGoogleClientId.length).to.be.greaterThan(0);
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