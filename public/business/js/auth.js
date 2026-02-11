const userToken = localStorage.getItem("userToken");

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    if (userToken) {
        await fetch("/api/users/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-token": userToken
            }
        });
    }

    localStorage.removeItem("userToken");
    window.location.href = "/login";
});

async function loadUser() {
    if (!userToken) return (window.location.href = "/login");

    const res = await fetch("/api/users/me", {
        headers: { "x-user-token": userToken }
    });

    if (!res.ok) {
        localStorage.removeItem("userToken");
        return (window.location.href = "/login");
    }

    const user = await res.json();
    const avatar = document.getElementById("avatar");
    const badge = document.getElementById("roleBadge");

    if (user.role === "guest") {
        avatar.src = "/images/defaultAvatar.png";
        avatar.style.filter = `hue-rotate(${getHueFromToken(userToken)}deg) saturate(20)`;
        badge.style.display = "inline-block";
    } else {
        avatar.src = user.avatarUrl;
        avatar.style.filter = "";
        badge.style.display = "none";
    }
}

loadUser(); 