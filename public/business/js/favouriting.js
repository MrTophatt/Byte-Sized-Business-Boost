const favouriteButton = document.getElementById("favourite-btn");
const favouriteIcon = document.getElementById("favourite-icon");
const favouriteLabel = document.getElementById("favourite-label");

const token = localStorage.getItem("userToken");
let isFavourited = false;

/**
 * Fetches the current signed-in user from API.
 * @returns {Promise<Object|null>} User object or null if unavailable.
 */
async function getUser() {
    if (!token) return null;

    try {
        const response = await fetch("/api/users/me", {
            headers: { "x-user-token": token }
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * Updates the save button icon/text based on favourite state.
 */
function updateFavouriteButton() {
    favouriteIcon.className = isFavourited ? "bi bi-heart-fill" : "bi bi-heart";
    favouriteLabel.textContent = isFavourited ? "Favourited" : "Favourite";
}

/**
 * Loads the current favourite state for the selected business.
 * @returns {Promise<void>}
 */
async function loadFavourite() {
    const user = await getUser();

    if (!user || user.role === "guest") {
        favouriteButton.style.display = "none";
        return;
    }

    try {
        const response = await fetch(`/api/favourites/${BUSINESS_ID}`, {
            headers: { "x-user-token": token }
        });

        if (!response.ok) throw new Error("Failed to load favourite");

        const data = await response.json();
        isFavourited = data.favourited;
        updateFavouriteButton();
    } catch (error) {
        console.error(error);
    }
}

favouriteButton.addEventListener("click", async () => {
    const user = await getUser();
    if (!user || user.role === "guest") return;

    try {
        const response = await fetch(`/api/favourites/${BUSINESS_ID}`, {
            method: "POST",
            headers: { "x-user-token": token }
        });

        if (!response.ok) return;

        const data = await response.json();
        isFavourited = data.favourited;
        updateFavouriteButton();

        if (typeof loadFavouriteStatistics === "function") {
            loadFavouriteStatistics();
        }
    } catch (error) {
        console.error(error);
    }
});

loadFavourite();