const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");

const webApp = require("../server");

let mainWindow;
let runningServer;

async function createWindow() {
    // 1. Fallback port if env is missing
    const port = process.env.PORT || 3000;
    const host = "localhost";
    const origin = `http://${host}:${port}`;

    try {
        // 2. Start your server
        runningServer = await webApp.startServer({ port, host });

        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            // Use path.resolve to be safer with icons
            icon: path.resolve(__dirname, "..", "assets", "icon.ico"),
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            }
        });

        // 3. Add a small delay or retry logic 
        // Sometimes the server takes a millisecond longer to start in production
        setTimeout(() => {
            mainWindow.loadURL(origin);
        }, 500);

    } catch (err) {
        // This will tell you EXACTLY what went wrong in the built version
        dialog.showErrorBox("Server Error", err.message);
        app.quit();
    }
}

async function shutdownServer() {
    if (runningServer?.close) {
        await runningServer.close();
        runningServer = null;
    }
}

app.whenReady().then(async () => {
    try {
        await createWindow();
    } catch (error) {
        console.error("Failed to launch desktop app", error);
        await dialog.showErrorBox(
            "Startup failed",
            "The desktop app could not start. Check MongoDB, OAuth settings, and that PORT are available."
        );
        app.quit();
    }

    app.on("activate", async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });
});

app.on("window-all-closed", async () => {
    await shutdownServer();
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("before-quit", async () => {
    await shutdownServer();
});