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
let mainWindow; // Reference to the main Electron window instance

// Reference to the running HTTP server instance
// Used so it can be cleanly shut down later
let runningServer;

/**
 * Creates the Electron browser window and boots the API server.
 * This function ensures the backend is running before loading the UI.
 */
async function createWindow() {
    // Fallback port if PORT is not defined in the environment
    const port = process.env.PORT || 3000;

    // Host the server locally
    const host = "localhost";

    // Base URL the Electron window will load
    const origin = `http://${host}:${port}`;

    try {
        // Start the Express server and store a reference to it
        runningServer = await WEB_APP.startServer({ port, host });

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
            mainWindow.loadURL(origin);
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

// Fired once Electron has finished initialization
app.whenReady().then(async () => {
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