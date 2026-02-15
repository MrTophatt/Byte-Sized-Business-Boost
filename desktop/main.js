/**
 * Entry point for the Electron desktop application.
 * Responsible for:
 * - Starting the backend API server
 * - Creating and managing the Electron browser window
 * - Handling application lifecycle events
 */

const { app, BrowserWindow, dialog } = require("electron");
const PATH = require("path");
const WEB_APP = require("../server"); // Import the Express app / server bootstrap logic

const APP_PROTOCOL = "bytesizedbusinessboost";
const APP_HOST = "localhost";
const APP_PORT = process.env.PORT || 3000;

let mainWindow; // Reference to the main Electron window instance
let appOrigin = null;
let pendingBusinessId = null;

// Reference to the running HTTP server instance
// Used so it can be cleanly shut down later
let runningServer;

/**
 * Registers OS protocol handler for deep links.
 * In development, Electron needs extra argv metadata.
 */
function registerProtocolClient() {
    if (process.defaultApp && process.argv[1]) {
        return app.setAsDefaultProtocolClient(
            APP_PROTOCOL,
            process.execPath,
            [PATH.resolve(process.argv[1])]
        );
    }

    return app.setAsDefaultProtocolClient(APP_PROTOCOL);
}

function getBusinessIdFromDeepLink(urlString = "") {
    try {
        const url = new URL(urlString);

        if (url.protocol !== `${APP_PROTOCOL}:`) {
            return null;
        }

        const pathParts = url.pathname.split("/").filter(Boolean);

        // Supports:
        // - bytesizedbusinessboost://business/<id>
        // - bytesizedbusinessboost:///business/<id>
        if (url.hostname === "business" && pathParts.length >= 1) {
            return pathParts[0];
        }

        if (pathParts[0] === "business" && pathParts[1]) {
            return pathParts[1];
        }

        if (url.hostname === "business" && url.searchParams.get("id")) {
            return url.searchParams.get("id");
        }

        return null;
    } catch (_error) {
        return null;
    }
}

function openBusinessFromDeepLink(urlString = "") {
    const businessId = getBusinessIdFromDeepLink(urlString);
    if (!businessId) return;

    const targetUrl = `${appOrigin || `http://${APP_HOST}:${APP_PORT}`}/business/${businessId}`;

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(targetUrl);
        return;
    }

    pendingBusinessId = businessId;
}

/**
 * Creates the Electron browser window and boots the API server.
 * This function ensures the backend is running before loading the UI.
 */
async function createWindow() {
    // Fallback port if PORT is not defined in the environment
    const port = APP_PORT;

    // Host the server locally
    const host = APP_HOST;

    try {
        // Start the Express server and store a reference to it
        runningServer = await WEB_APP.startServer({ port, host });
        appOrigin = `http://${host}:${runningServer.port || port}`;

        // Create the Electron browser window
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,

            // Explicitly resolve icon path for reliability in production builds
            icon: PATH.resolve(__dirname, "..", "assets", "icon.ico"),

            // Harden security by disabling Node.js access in the renderer
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            }
        });

        // Delay loading the URL slightly to ensure the server is fully listening
        // This prevents race conditions in production builds
        setTimeout(() => {
            const targetUrl = pendingBusinessId
                ? `${appOrigin}/business/${pendingBusinessId}`
                : appOrigin;

            pendingBusinessId = null;
            mainWindow.loadURL(targetUrl);
        }, 500);

    } catch (err) {
        // Display an error dialog if server startup fails
        dialog.showErrorBox("Server Error", err.message);

        // Exit the application to avoid a broken state
        app.quit();
    }
}

/**
 * Gracefully shuts down the running API server.
 * Prevents port leaks and allows clean app exit.
 */
async function shutdownServer() {
    if (runningServer?.close) {
        await runningServer.close();
        runningServer = null;
    }
}

// Ensure only one desktop instance handles deep links.
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
    app.quit();
}

app.on("open-url", (event, url) => {
    event.preventDefault();
    openBusinessFromDeepLink(url);
});

app.on("second-instance", (_event, argv) => {
    const deepLinkArg = argv.find((arg) => arg.startsWith(`${APP_PROTOCOL}://`));

    if (deepLinkArg) {
        openBusinessFromDeepLink(deepLinkArg);
    }

    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }

        mainWindow.focus();
    }
});

// Fired once Electron has finished initialization
app.whenReady().then(async () => {
    registerProtocolClient();
    
    const deepLinkArg = process.argv.find((arg) => arg.startsWith(`${APP_PROTOCOL}://`));

    if (deepLinkArg) {
        openBusinessFromDeepLink(deepLinkArg);
    }

    try {
        // Create the main window and start the server
        await createWindow();
    } catch (error) {
        console.error("Failed to launch desktop app", error);

        // Show a user-friendly error message
        await dialog.showErrorBox(
            "Startup failed",
            "The desktop app could not start. Check MongoDB, OAuth settings, and that PORT are available."
        );

        app.quit();
    }

    // macOS behavior: re-create window if dock icon is clicked
    app.on("activate", async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });
});

// Fired when all windows are closed
app.on("window-all-closed", async () => {
    // Always shut down the server first
    await shutdownServer();

    // On non-macOS platforms, fully quit the app
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// Final cleanup hook before quitting
app.on("before-quit", async () => {
    await shutdownServer();
});