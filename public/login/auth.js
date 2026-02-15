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

        // Store the session token returned by the backend in localStorage
        // This token is used for authenticated requests across the app
        localStorage.setItem("userToken", data.token);

        // Redirect the user to the home page after successful login
        window.location.href = "/";
    });
}

/**
 * Starts a guest user session.
 * This function requests a temporary user account from the backend.
 */
async function startSession() {

    // Send a request to create a new guest user session
    const res = await fetch("/api/users/generate", {
        method: "POST"
    });

    // Parse the created user object returned by the backend
    const user = await res.json();

    // Store the generated session token in localStorage
    localStorage.setItem("userToken", user.token);

    // Redirect the user to the home page
    window.location.href = "/";
}

// Attach a click handler to the login button (if it exists)
// The optional chaining prevents errors if the element is not present
document.getElementById("loginBtn")?.addEventListener("click", startSession);