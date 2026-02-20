/**
 * Handles a successful Google login response.
 * This function is expected to be called by Google's OAuth callback.
 *
 * @param {Object} response - Google OAuth response object
 * @param {string} response.credential - Google ID token (JWT)
 */
function handleGoogleLogin(response) {

    // Send the Google ID token to the backend for verification and login
    fetch("/api/auth/google", {
        method: "POST",

        // Indicate that the request body contains JSON data
        headers: { "Content-Type": "application/json" },

        // Send the Google credential token in the request body
        body: JSON.stringify({
            token: response.credential
        })
    })
    // Parse the JSON response from the backend
    .then(res => res.json())

    // Handle the parsed response data
    .then(data => {
        if (!data.token) {
            throw new Error(data.error || "Google login failed");
        }

        // Store the session token returned by the backend in localStorage
        // This token is used for authenticated requests across the app
        localStorage.setItem("userToken", data.token);

        // Redirect the user to the home page after successful login
        window.location.href = "/";
    })
    .catch(err => showMessage(err.message, true));
}

function showMessage(message, isError = false) {
    const messageEl = document.getElementById("authMessage");
    messageEl.textContent = message;
    messageEl.classList.toggle("error", isError);
}

async function loginWithPassword(event) {
    event.preventDefault();

    const identity = document.getElementById("loginIdentity").value.trim();
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password })
    });

    const data = await res.json();

    if (!res.ok || !data.token) {
        showMessage(data.error || "Login failed", true);
        return;
    }

    localStorage.setItem("userToken", data.token);
    window.location.href = "/";
}

document.getElementById("loginForm")?.addEventListener("submit", loginWithPassword);