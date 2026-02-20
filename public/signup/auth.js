function showMessage(message, isError = false) {
    const messageEl = document.getElementById("authMessage");
    messageEl.textContent = message;
    messageEl.classList.toggle("error", isError);
}

let pendingSignupEmail = "";
let verificationModal;

async function startSignup(event) {
    event.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    const response = await fetch("/api/auth/signup/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
        showMessage(data.error || "Could not send verification email", true);
        return;
    }

    pendingSignupEmail = email;
    document.getElementById("verificationCode").value = "";
    verificationModal.show();
    showMessage("Verification code sent. Check your inbox.");
}

async function completeSignup() {
    const code = document.getElementById("verificationCode").value.trim();

    if (!pendingSignupEmail || !code) {
        showMessage("Please enter the verification code.", true);
        return;
    }

    const response = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingSignupEmail, code })
    });

    const data = await response.json();

    if (!response.ok || !data.token) {
        showMessage(data.error || "Verification failed", true);
        return;
    }

    localStorage.setItem("userToken", data.token);
    window.location.href = "/";
}

document.addEventListener("DOMContentLoaded", () => {
    verificationModal = new bootstrap.Modal(document.getElementById("verificationModal"));
    document.getElementById("signupForm")?.addEventListener("submit", startSignup);
    document.getElementById("confirmVerificationBtn")?.addEventListener("click", completeSignup);
});