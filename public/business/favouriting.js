const favBtn = document.getElementById("favourite-btn");
const outline = document.getElementById("heart-outline");
const filled = document.getElementById("heart-filled");

const token = localStorage.getItem("userToken");
let isFavourited = false;

// Fetch user info to check role
async function getUser() {
    if (!token) return null;

    try {
        const res = await fetch("/api/users/me", {
            headers: { "x-user-token": token }
        });
        if (!res.ok) return null;
        const user = await res.json();
        return user;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function loadFavourite() {
    const user = await getUser();

    // Hide favourite button for guests or missing user
    if (!user || user.role === "guest") {
        favBtn.style.display = "none";
        return;
    }

    try {
        const res = await fetch(`/api/favourites/${BUSINESS_ID}`, {
            headers: { "x-user-token": token }
        });
        if (!res.ok) throw new Error("Failed to load favourite");

        const data = await res.json();
        isFavourited = data.favourited;
        updateHeart();
    } catch (err) {
        console.error(err);
    }
}

favBtn.addEventListener("click", async () => {
    const user = await getUser();

    if (!user || user.role === "guest") return; // Guests cannot favourite

    try {
        const res = await fetch(`/api/favourites/${BUSINESS_ID}`, {
            method: "POST",
            headers: { "x-user-token": token }
        });
        if (!res.ok) return;

        const data = await res.json();
        isFavourited = data.favourited;
        updateHeart();
    } catch (err) {
        console.error(err);
    }
});

function updateHeart() {
    outline.style.display = isFavourited ? "none" : "block";
    filled.style.display = isFavourited ? "block" : "none";
}

// Initialize
loadFavourite();