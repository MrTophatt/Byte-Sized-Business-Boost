const userToken = localStorage.getItem("userToken");

const favouritesList = document.getElementById("favouritesList");
const reviewsList = document.getElementById("reviewsList");

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function getHueFromToken(token) {
    return Math.abs(hashString(token)) % 360;
}

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: { "x-user-token": userToken }
    });
    if (!res.ok) throw new Error(`Request failed: ${url}`);
    return res.json();
}

async function loadProfile() {
    if (!userToken) {
        window.location.href = "/login";
        return;
    }

    try {
        const user = await fetchJson("/api/users/me");
        const avatar = document.getElementById("avatar");
        const largeAvatar = document.getElementById("profileAvatar");
        const badge = document.getElementById("roleBadge");
        const name = document.getElementById("profileName");
        const email = document.getElementById("profileEmail");

        avatar.src = user.avatarUrl || "/images/defaultAvatar.png";
        largeAvatar.src = user.avatarUrl || "/images/defaultAvatar.png";
        avatar.alt = user.name || "User avatar";
        name.textContent = user.name || "Guest";
        email.textContent = user.email || "";

        console.log(user)

        if (user.role === "guest") {
            avatar.style.filter = `hue-rotate(${getHueFromToken(userToken)}deg) saturate(20)`;
            largeAvatar.style.filter = `hue-rotate(${getHueFromToken(userToken)}deg) saturate(20)`;
            badge.style.display = "inline-block";
        } else {
            avatar.style.filter = "";
            badge.style.display = "none";
        }

        await Promise.all([loadFavourites(), loadReviews()]);
    } catch (err) {
        console.error(err);
        localStorage.removeItem("userToken");
        window.location.href = "/login";
    }
}

async function loadFavourites() {
    favouritesList.innerHTML = "";

    const { favourites } = await fetchJson("/api/users/favourites");
    if (!favourites.length) {
        favouritesList.innerHTML = "<div>No favourites yet.</div>";
        return;
    }

    const businessesRes = await fetch("/api/businesses");
    if (!businessesRes.ok) {
        favouritesList.innerHTML = "<div>Unable to load favourites.</div>";
        return;
    }
    const businesses = await businessesRes.json();
    const favouriteBusinesses = businesses.filter(business =>
        favourites.includes(business._id)
    );

    if (!favouriteBusinesses.length) {
        favouritesList.innerHTML = "<div>No favourites yet.</div>";
        return;
    }

    favouriteBusinesses.forEach(business => {
        const item = document.createElement("a");
        item.className = "list-group-item list-group-item-action";
        item.href = `/business/${business._id}`;
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${business.name}</span>
                <small>
                    <i class="bi bi-star-fill text-warning"></i> ${business.avgRating} (${business.reviewCount})
                </small>
            </div>
        `;
        favouritesList.appendChild(item);
    });
}

async function loadReviews() {
    reviewsList.innerHTML = "";

    const reviews = await fetchJson("/api/reviews/me");
    if (!reviews.length) {
        reviewsList.innerHTML = "<div>No reviews yet.</div>";
        return;
    }

    reviews.forEach(review => {
        const item = document.createElement("div");
        item.className = "list-group-item";
        const businessName = review.business?.name || "Unknown business";
        const businessId = review.business?._id;
        const businessLink = businessId
            ? `<a href="/business/${businessId}">${businessName}</a>`
            : businessName;
        item.innerHTML = `
            <div class="d-flex justify-content-between">
                <strong>${review.title}</strong>
                <span>
                    <i class="bi bi-star-fill text-warning"></i> ${review.rating}
                </span>
            </div>
            <small>${businessLink}</small>
            <p class="mb-0">${review.body || ""}</p>
        `;
        reviewsList.appendChild(item);
    });
}

loadProfile();