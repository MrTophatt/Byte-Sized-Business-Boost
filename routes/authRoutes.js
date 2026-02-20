const express = require("express");
const router = express.Router();

// Google OAuth client used to verify Google ID tokens
const { OAuth2Client } = require("google-auth-library");

// User model used to find/create users in the database
const User = require("../models/User");

// Crypto module used to generate secure random values
const crypto = require("crypto");

const USER_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const SIGNUP_CODE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_SIGNUP_AVATARS = [
    "/images/default-avatars/default-avatar-1.svg",
    "/images/default-avatars/default-avatar-2.svg",
    "/images/default-avatars/default-avatar-3.svg"
];

// Initialize Google OAuth client with the configured client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory pending signups (sufficient for this project scope)
const pendingSignups = new Map();

function normalizeIdentity(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const digest = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return `${salt}:${digest}`;
}

function verifyPassword(password, storedHash) {
    if (typeof storedHash !== "string" || !storedHash.includes(":")) {
        return false;
    }

    const [salt, digest] = storedHash.split(":");
    const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");

    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(candidate, "hex"));
}

function getRandomDefaultSignupAvatar() {
    const index = crypto.randomInt(DEFAULT_SIGNUP_AVATARS.length);
    return DEFAULT_SIGNUP_AVATARS[index];
}

function gmailIsConfigured() {
    return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getMailTransporter() {
    const nodemailer = require("nodemailer");

    if (!gmailIsConfigured()) {
        throw new Error("Gmail is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        connectionTimeout: Number(process.env.SMTP_TIMEOUT_MS || 10000)
    });
}

async function sendVerificationEmail(email, code) {
    if (process.env.NODE_ENV === "test") {
        return;
    }

    const from = process.env.GMAIL_FROM || process.env.GMAIL_USER;
    const subject = "Your Byte-Sized Business Boost verification code";
    const body = `Your verification code is ${code}. It expires in 10 minutes.`;

    try {
        const transporter = getMailTransporter();
        await transporter.sendMail({
            from,
            to: email,
            subject,
            text: body
        });
        return;
    } catch (err) {
        throw new Error(`Email delivery failed: ${err.message}`);
    }
}

/**
 * POST /auth/signup/start
 * Starts email verification by generating and "sending" a verification code.
 */
router.post("/signup/start", async (req, res) => {
    try {
        const username = normalizeIdentity(req.body.username);
        const email = normalizeIdentity(req.body.email);
        const password = typeof req.body.password === "string" ? req.body.password : "";

        if (!username || !email || password.length < 8) {
            return res.status(400).json({ error: "Username, email, and a password (8+ chars) are required" });
        }

        const existingUser = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        }).lean();

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(409).json({ error: "Username is already taken" });
            }

            return res.status(409).json({ error: "Email is already in use" });
        }

        const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
        await sendVerificationEmail(email, verificationCode);

        pendingSignups.set(email, {
            username,
            email,
            passwordHash: hashPassword(password),
            verificationCode,
            expiresAt: Date.now() + SIGNUP_CODE_TTL_MS
        });

        return res.json({
            message: "Verification code sent to your email",
            // Exposed only for local/dev convenience; hidden outside test runs.
            devVerificationCode: process.env.NODE_ENV === "test" ? verificationCode : undefined
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to send verification email" });
    }
});

/**
 * POST /auth/signup/verify
 * Finalizes signup after user submits the email verification code.
 */
router.post("/signup/verify", async (req, res) => {
    try {
        const email = normalizeIdentity(req.body.email);
        const code = typeof req.body.code === "string" ? req.body.code.trim() : "";
        const pending = pendingSignups.get(email);

        if (!pending || pending.expiresAt < Date.now()) {
            pendingSignups.delete(email);
            return res.status(400).json({ error: "Verification code expired. Please sign up again." });
        }

        if (code !== pending.verificationCode) {
            return res.status(400).json({ error: "Invalid verification code" });
        }

        const existingUser = await User.findOne({
            $or: [
                { username: pending.username },
                { email: pending.email }
            ]
        }).lean();

        if (existingUser) {
            pendingSignups.delete(email);
            return res.status(409).json({ error: "Account already exists" });
        }

        const nextToken = crypto.randomUUID();
        const nextTokenExpiry = new Date(Date.now() + USER_SESSION_MS);

        const user = await User.create({
            username: pending.username,
            email: pending.email,
            passwordHash: pending.passwordHash,
            role: "user",
            name: pending.username,
            avatarUrl: getRandomDefaultSignupAvatar(),
            token: nextToken,
            tokenExpiresAt: nextTokenExpiry,
            guestExpiresAt: null
        });

        pendingSignups.delete(email);

        return res.json({ token: user.token });
    } catch (err) {
        if (err && err.code === 11000) {
            return res.status(409).json({ error: "Username or email already exists" });
        }

        console.error(err);
        return res.status(500).json({ error: "Signup failed" });
    }
});

/**
 * POST /auth/login
 * Logs in using username/email + password.
 */
router.post("/login", async (req, res) => {
    try {
        const identity = normalizeIdentity(req.body.identity);
        const password = typeof req.body.password === "string" ? req.body.password : "";

        if (!identity || !password) {
            return res.status(400).json({ error: "Identity and password are required" });
        }

        const user = await User.findOne({
            $or: [
                { username: identity },
                { email: identity }
            ]
        });

        if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        user.role = "user";
        user.token = crypto.randomUUID();
        user.tokenExpiresAt = new Date(Date.now() + USER_SESSION_MS);
        user.guestExpiresAt = null;
        await user.save();

        return res.json({ token: user.token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Login failed" });
    }
});

/**
 * POST /auth/google
 * Handles Google OAuth login.
 * Verifies the Google ID token, then creates or updates a user record.
 */
router.post("/google", async (req, res) => {

    // Extract the Google ID token sent from the frontend
    const { token } = req.body;

    try {
        // Verify the Google ID token against Google's servers
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        // Extract user information from the verified token
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        if (!googleId || !email) {
            return res.status(400).json({ error: "Google login failed" });
        }

        const normalizedEmail = normalizeIdentity(email);
        const nextToken = crypto.randomUUID();
        const nextTokenExpiry = new Date(Date.now() + USER_SESSION_MS);

        // Attempt to find an existing user with this Google account
        let user = await User.findOne({ googleId });

        if (!user) {
            user = await User.findOne({ email: normalizedEmail });
        }

        if (!user) {
            // If user does not exist, create a new account
            user = await User.create({
                googleId,
                email: normalizedEmail,
                name,
                role: "user",
                avatarUrl: null,
                token: nextToken,
                tokenExpiresAt: nextTokenExpiry,
                guestExpiresAt: null
            });
        } else {
            // Existing user: generate a new session token
            user.role = "user";
            user.googleId = user.googleId || googleId;
            user.email = user.email || normalizedEmail;
            user.name = user.name || name;
            user.avatarUrl = null;
            user.token = nextToken;
            user.tokenExpiresAt = nextTokenExpiry;
            user.guestExpiresAt = null;
            await user.save();
        }

        // Send session token to the client
        res.json({ token: user.token });

    } catch (err) {
        // Duplicate key conflicts indicate account identity mismatch attempt
        if (err && err.code === 11000) {
            return res.status(409).json({ error: "Account conflict detected" });
        }

        // Any verification or database failure is treated as login failure
        console.error(err);
        res.status(400).json({ error: "Google login failed" });
    }
});

module.exports = router;