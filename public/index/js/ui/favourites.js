/**
 * Fetches the current user's favourite businesses and updates
 * the UI to reflect which businesses are favourited.
 */
async function updateFavourites() {
    // If the user is not logged in, skip updating favourites
    if (!USER_TOKEN) return;

    // Fetch favourited business IDs for the current user
    const res = await fetch("/api/users/favourites", {
        headers: { "x-user-token": USER_TOKEN }
    });

    // Abort if request fails
    if (!res.ok) return;

    // Extract favourites array from response
    const { favourites } = await res.json();

    // Iterate over all rendered business cards
    document.querySelectorAll(".card").forEach(card => {
        // Extract business ID from the link URL
        const id = card.querySelector("a")?.href.split("/").pop();

        // Locate the favourite icon inside the card
        const heart = card.querySelector(".favourite-icon");

        // Skip if required elements are missing
        if (!heart) return;

        // Show or hide the favourite icon based on user favourites
        heart.style.display = favourites.includes(id)
            ? "block"
            : "none";
    });
}