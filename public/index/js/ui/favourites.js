async function updateFavourites() {
    if (!userToken) return;

    const res = await fetch("/api/users/favourites", {
        headers: { "x-user-token": userToken }
    });

    if (!res.ok) return;
    const { favourites } = await res.json();

    document.querySelectorAll(".card").forEach(card => {
        const id = card.querySelector("a")?.href.split("/").pop();
        const heart = card.querySelector(".favourite-icon");
        if (!heart) return;

        heart.style.display = favourites.includes(id) ? "block" : "none";
    });
}