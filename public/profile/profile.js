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

function getViewedUserIdFromPath() {
    const [, profileSegment, userId] = window.location.pathname.split("/");
    if (profileSegment !== "profile") return null;
    return userId || null;
}

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: { "x-user-token": userToken }
    });
    if (!res.ok) throw new Error(`Request failed: ${url}`);
    return res.json();
}

function renderEmptyState(container, text) {
    container.innerHTML = `<div class="profile-empty-state">${text}</div>`;
}

function createSectionLabel(text) {
    const tag = document.createElement("span");
    tag.className = "profile-section-label";
    tag.textContent = text;
    return tag;
}

async function loadProfile() {
    if (!userToken) {
        window.location.href = "/login";
        return;
    }

    try {
        const viewedUserId = getViewedUserIdFromPath();
        const [viewer, viewedUser] = await Promise.all([
            fetchJson("/api/users/me"),
            viewedUserId ? fetchJson(`/api/users/${viewedUserId}`) : fetchJson("/api/users/me")
        ]);

        const isOwnProfile = String(viewer._id) === String(viewedUser._id);
        const avatar = document.getElementById("avatar");
        const largeAvatar = document.getElementById("profileAvatar");
        const badge = document.getElementById("roleBadge");
        const name = document.getElementById("profileName");
        const email = document.getElementById("profileEmail");
        const profileContext = document.getElementById("profileContext");
        const favouritesHeading = document.getElementById("favouritesHeading");
        const reviewsHeading = document.getElementById("reviewsHeading");

        avatar.src = viewer.avatarUrl || "/images/defaultAvatar.png";
        avatar.alt = viewer.name || "User avatar";

        largeAvatar.src = viewedUser.avatarUrl || "/images/defaultAvatar.png";
        largeAvatar.alt = viewedUser.name || "User avatar";

        name.textContent = viewedUser.name || "Guest";
        email.textContent = viewedUser.email || (isOwnProfile ? "" : "Email hidden");

        if (viewer.role === "guest") {
            avatar.style.filter = `hue-rotate(${getHueFromToken(userToken)}deg) saturate(20)`;
            badge.style.display = "inline-block";
        } else {
            avatar.style.filter = "";
            badge.style.display = "none";
        }

        if (viewedUser.role === "guest") {
            largeAvatar.style.filter = `hue-rotate(${getHueFromToken(String(viewedUser._id))}deg) saturate(20)`;
        } else {
            largeAvatar.style.filter = "";
        }

        document.title = `${name.textContent} | Profile`;

        profileContext.innerHTML = "";
        profileContext.appendChild(
            createSectionLabel(isOwnProfile ? "Your Profile" : "Community Profile")
        );

        favouritesHeading.textContent = isOwnProfile
            ? "Your Favourite Businesses"
            : `${name.textContent.split(" ")[0]}'s Favourite Businesses`;

        reviewsHeading.textContent = isOwnProfile
            ? "Your Reviews"
            : `${name.textContent.split(" ")[0]}'s Reviews`;

        await Promise.all([
            loadFavourites(viewedUser.favourites),
            loadReviews(viewedUser._id)
        ]);
    } catch (err) {
        console.error(err);
        localStorage.removeItem("userToken");
        window.location.href = "/login";
    }
}

async function loadFavourites(favourites = []) {
    favouritesList.innerHTML = "";

    if (!favourites.length) {
        renderEmptyState(favouritesList, "No favourites yet.");
        return;
    }

    const businessesRes = await fetch("/api/businesses");
    if (!businessesRes.ok) {
        renderEmptyState(favouritesList, "Unable to load favourites.");
        return;
    }

    const businesses = await businessesRes.json();
    const favouriteBusinesses = businesses.filter((business) =>
        favourites.includes(business._id)
    );

    if (!favouriteBusinesses.length) {
        renderEmptyState(favouritesList, "No favourites yet.");
        return;
    }

    favouriteBusinesses.forEach((business) => {
        const item = document.createElement("a");
        item.className = "profile-card profile-card-link";
        item.href = `/business/${business._id}`;
        item.innerHTML = `
            <div>
                <div class="profile-card-title">${business.name}</div>
                <small class="profile-card-meta">Popular local business</small>
            </div>
            <small class="profile-card-rating">
                <i class="bi bi-star-fill text-warning"></i> ${business.avgRating} <span>(${business.reviewCount})</span>
            </small>
        `;
        favouritesList.appendChild(item);
    });
}

async function loadReviews(userId) {
    reviewsList.innerHTML = "";

    const reviews = await fetchJson(`/api/reviews/user/${userId}`);
    if (!reviews.length) {
        renderEmptyState(reviewsList, "No reviews yet.");
        return;
    }

    reviews.forEach((review) => {
        const item = document.createElement("article");
        item.className = "profile-card";
        const businessName = review.business?.name || "Unknown business";
        const businessId = review.business?._id;
        const businessLink = businessId
            ? `<a href="/business/${businessId}">${businessName}</a>`
            : businessName;

        item.innerHTML = `
            <div class="profile-review-header">
                <strong class="profile-card-title">${review.title}</strong>
                <span class="profile-card-rating">
                    <i class="bi bi-star-fill text-warning"></i> ${review.rating}
                </span>
            </div>
            <small class="profile-card-meta">${businessLink}</small>
            <p class="profile-card-body mb-0">${review.body || "No written comment."}</p>
        `;
        reviewsList.appendChild(item);
    });
}

loadProfile();