const express = require("express");
const router = express.Router();

// Google OAuth client used to verify Google ID tokens
const { OAuth2Client } = require("google-auth-library");

// User model used to find/create users in the database
const User = require("../models/User");

// Crypto module used to generate secure random values
const crypto = require("crypto");
const net = require("net");
const tls = require("tls");
const { execFile } = require("child_process");
const { promisify } = require("util");

const USER_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const SIGNUP_CODE_TTL_MS = 10 * 60 * 1000;

// Initialize Google OAuth client with the configured client ID
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory pending signups (sufficient for this project scope)
const pendingSignups = new Map();

const execFileAsync = promisify(execFile);

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

function dotEscape(line) {
    if (line.startsWith(".")) {
        return `.${line}`;
    }

    return line;
}

function verifyPassword(password, storedHash) {
    if (typeof storedHash !== "string" || !storedHash.includes(":")) {
        return false;
    }

    const [salt, digest] = storedHash.split(":");
    const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");

    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(candidate, "hex"));
}

function dotEscape(line) {
    if (line.startsWith(".")) {
        return `.${line}`;
    }

    return line;
}

function buildSmtpMessage({ from, to, subject, body }) {
    return [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body
    ].join("\r\n");
}

function readSmtpResponse(socket, timeoutMs) {
    return new Promise((resolve, reject) => {
        let buffer = "";
        let timer;

        const cleanup = () => {
            socket.off("data", onData);
            socket.off("error", onError);
            clearTimeout(timer);
        };

        const onError = err => {
            cleanup();
            reject(err);
        };

        const onData = chunk => {
            buffer += chunk.toString("utf8");
            const lines = buffer.split("\r\n").filter(Boolean);

            if (!lines.length) {
                return;
            }

            const lastLine = lines[lines.length - 1];

            if (/^\d{3} /.test(lastLine)) {
                cleanup();
                resolve(lastLine);
            }
        };

        timer = setTimeout(() => {
            cleanup();
            reject(new Error("SMTP response timeout"));
        }, timeoutMs);

        socket.on("data", onData);
        socket.on("error", onError);
    });
}

async function smtpCommand(socket, command, expectedCodes, timeoutMs) {
    if (command) {
        socket.write(`${command}\r\n`);
    }

    const response = await readSmtpResponse(socket, timeoutMs);
    const code = Number(response.slice(0, 3));

    if (!expectedCodes.includes(code)) {
        throw new Error(`SMTP command failed (${code}): ${response}`);
    }

    return response;
}

async function sendViaSmtp({ host, port, secure, user, pass, from, to, subject, body, timeoutMs }) {
    const socket = secure
        ? tls.connect({
            host,
            port,
            servername: host
        })
        : net.createConnection({ host, port });

    await new Promise((resolve, reject) => {
        const onError = err => {
            socket.off("connect", onConnect);
            reject(err);
        };

        const onConnect = () => {
            socket.off("error", onError);
            resolve();
        };

        socket.once("error", onError);
        socket.once("connect", onConnect);
        socket.setTimeout(timeoutMs, () => {
            socket.destroy(new Error("SMTP connection timeout"));
        });
    });

    try {
        await smtpCommand(socket, null, [220], timeoutMs);
        await smtpCommand(socket, `EHLO ${host}`, [250], timeoutMs);

        if (user && pass) {
            await smtpCommand(socket, "AUTH LOGIN", [334], timeoutMs);
            await smtpCommand(socket, Buffer.from(user, "utf8").toString("base64"), [334], timeoutMs);
            await smtpCommand(socket, Buffer.from(pass, "utf8").toString("base64"), [235], timeoutMs);
        }

        await smtpCommand(socket, `MAIL FROM:<${from}>`, [250], timeoutMs);
        await smtpCommand(socket, `RCPT TO:<${to}>`, [250, 251], timeoutMs);
        await smtpCommand(socket, "DATA", [354], timeoutMs);

        const dataLines = buildSmtpMessage({ from, to, subject, body })
            .split("\r\n")
            .map(dotEscape)
            .join("\r\n");

        socket.write(`${dataLines}\r\n.\r\n`);
        await smtpCommand(socket, null, [250], timeoutMs);
        await smtpCommand(socket, "QUIT", [221], timeoutMs);
    } finally {
        socket.end();
    }
}

async function sendViaSendmail({ from, to, subject, body }) {
    const message = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body
    ].join("\n");

    await execFileAsync("/usr/sbin/sendmail", ["-t", "-i"], { input: message });
}

function parseBooleanEnv(value) {
    return typeof value === "string" && ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function smtpIsConfigured() {
    return Boolean(process.env.SMTP_HOST);
}

async function sendVerificationEmail(email, code) {
    if (process.env.NODE_ENV === "test") {
        return;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@bytesized.local";
    const subject = "Your Byte-Sized Business Boost verification code";
    const body = `Your verification code is ${code}. It expires in 10 minutes.`;

    const smtpConfig = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: parseBooleanEnv(process.env.SMTP_SECURE),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        timeoutMs: Number(process.env.SMTP_TIMEOUT_MS || 10000)
    };

    const errors = [];

    if (smtpIsConfigured()) {
        try {
            await sendViaSmtp({
                ...smtpConfig,
                from,
                to: email,
                subject,
                body
            });
            return;
        } catch (err) {
            errors.push(`SMTP failed: ${err.message}`);
        }
    }

    try {
        await sendViaSendmail({ from, to: email, subject, body });
        return;
    } catch (err) {
        if (err && err.code === "ENOENT") {
            errors.push("Sendmail not found at /usr/sbin/sendmail");
        } else {
            errors.push(`Sendmail failed: ${err.message}`);
        }
    }

    throw new Error(`Email delivery failed. ${errors.join("; ")}`);
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
            // Exposed only for local/dev convenience because this project has no SMTP integration yet.
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
        const { sub: googleId, email, name, picture } = payload;

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
                token: nextToken,
                tokenExpiresAt: nextTokenExpiry,
                avatarUrl: picture,
                guestExpiresAt: null
            });
        } else {
            // Existing user: generate a new session token
            user.role = "user";
            user.googleId = user.googleId || googleId;
            user.email = user.email || normalizedEmail;
            user.name = user.name || name;
            user.avatarUrl = picture;
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