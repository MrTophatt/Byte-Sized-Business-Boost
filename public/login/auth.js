function handleGoogleLogin(response) {
    fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        localStorage.setItem("userToken", data.token);
        window.location.href = "/";
    });
}

async function startSession() {
    const res = await fetch("/api/users/generate", {
        method: "POST"
    });

    const user = await res.json();
    localStorage.setItem("userToken", user.token);

    window.location.href = "/";
}

document.getElementById("loginBtn")?.addEventListener("click", startSession);
