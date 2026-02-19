const USER_TOKEN = localStorage.getItem("userToken"); // Retrieve the user's session token from localStorage (if present)

// Attach logout behavior to the logout button if it exists
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    // If the user is logged in, notify the backend to invalidate the session
    if (USER_TOKEN) {
        await fetch("/api/users/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-token": USER_TOKEN
            }
        });
    }

    // Remove the session token from localStorage
    localStorage.removeItem("userToken");

    // Redirect the user back to the login page
    window.location.href = "/login";
});

/**
 * Loads the authenticated user's data from the server.
 *
 * - Redirects to login if no token exists
 * - Redirects to login if the token is invalid
 * - Updates avatar and role badge based on user role
 *
 * @returns {any} Redirects to login page if user is invalid
 */
async function loadUser() {
    // If there is no token, force login
    if (!USER_TOKEN) return (window.location.href = "/login");

    // Request the current user's profile from the backend
    const res = await fetch("/api/users/me", {
        headers: { "x-user-token": USER_TOKEN }
    });

    // If authentication fails, clear token and redirect
    if (!res.ok) {
        localStorage.removeItem("userToken");
        return (window.location.href = "/login");
    }

    // Parse returned user object
    const user = await res.json();

    // DOM elements used for user UI
    const avatar = document.getElementById("avatar");
    const badge = document.getElementById("roleBadge");

    // Special handling for guest users
    if (user.role === "guest") {
        // Use default avatar image
        avatar.src = "/images/defaultAvatar.png";

        // Apply deterministic color styling based on token
        avatar.style.filter = `hue-rotate(${getHueFromToken(USER_TOKEN)}deg) saturate(20)`;

        // Show the "Guest" badge
        badge.style.display = "inline-block";
    } else {
        // Use the user's actual avatar image
        avatar.src = user.avatarUrl;

        // Remove any guest-specific styling
        avatar.style.filter = "";

        // Hide the role badge
        badge.style.display = "none";
    }
}

loadUser(); // Immediately load user data on script execution