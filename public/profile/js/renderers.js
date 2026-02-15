(function registerProfileRenderers() {
    const { DEFAULT_AVATAR_URL, GUEST_ROLE } = window.profileConstants;
    const { getHueFromToken, getFirstName } = window.profileUtils;

    function renderEmptyState(container, text) {
        container.innerHTML = `<div class="profile-empty-state">${text}</div>`;
    }

    function createSectionLabel(text) {
        const sectionLabelElement = document.createElement("span");
        sectionLabelElement.className = "profile-section-label";
        sectionLabelElement.textContent = text;
        return sectionLabelElement;
    }

    function renderProfileHeader(viewer, viewedUser, userToken) {
        const isOwnProfile = String(viewer._id) === String(viewedUser._id);
        const avatarElement = document.getElementById("avatar");
        const profileAvatarElement = document.getElementById("profileAvatar");
        const roleBadgeElement = document.getElementById("roleBadge");
        const profileNameElement = document.getElementById("profileName");
        const profileEmailElement = document.getElementById("profileEmail");
        const profileContextElement = document.getElementById("profileContext");
        const favouritesHeadingElement = document.getElementById("favouritesHeading");
        const reviewsHeadingElement = document.getElementById("reviewsHeading");

        avatarElement.src = viewer.avatarUrl || DEFAULT_AVATAR_URL;
        avatarElement.alt = viewer.name || "User avatar";

        profileAvatarElement.src = viewedUser.avatarUrl || DEFAULT_AVATAR_URL;
        profileAvatarElement.alt = viewedUser.name || "User avatar";

        profileNameElement.textContent = viewedUser.name || "Guest";
        profileEmailElement.textContent = viewedUser.email || (isOwnProfile ? "" : "Email hidden");

        if (viewer.role === GUEST_ROLE) {
            avatarElement.style.filter = `hue-rotate(${getHueFromToken(userToken)}deg) saturate(20)`;
            roleBadgeElement.style.display = "inline-block";
        } else {
            avatarElement.style.filter = "";
            roleBadgeElement.style.display = "none";
        }

        if (viewedUser.role === GUEST_ROLE) {
            profileAvatarElement.style.filter = `hue-rotate(${getHueFromToken(String(viewedUser._id))}deg) saturate(20)`;
        } else {
            profileAvatarElement.style.filter = "";
        }

        document.title = `${profileNameElement.textContent} | Profile`;

        profileContextElement.innerHTML = "";
        profileContextElement.appendChild(
            createSectionLabel(isOwnProfile ? "Your Profile" : "Community Profile")
        );

        const firstName = getFirstName(profileNameElement.textContent);

        favouritesHeadingElement.textContent = isOwnProfile
            ? "Your Favourite Businesses"
            : `${firstName}'s Favourite Businesses`;

        reviewsHeadingElement.textContent = isOwnProfile
            ? "Your Reviews"
            : `${firstName}'s Reviews`;
    }

    function renderFavourites(favouritesListElement, businesses, favourites = []) {
        favouritesListElement.innerHTML = "";

        if (!favourites.length) {
            renderEmptyState(favouritesListElement, "No favourites yet.");
            return;
        }

        const favouriteBusinesses = businesses.filter((business) => favourites.includes(business._id));

        if (!favouriteBusinesses.length) {
            renderEmptyState(favouritesListElement, "No favourites yet.");
            return;
        }

        favouriteBusinesses.forEach((business) => {
            const favouriteCardElement = document.createElement("a");
            favouriteCardElement.className = "profile-card profile-card-link";
            favouriteCardElement.href = `/business/${business._id}`;
            favouriteCardElement.innerHTML = `
                <div>
                    <div class="profile-card-title">${business.name}</div>
                    <small class="profile-card-meta">Popular local business</small>
                </div>
                <small class="profile-card-rating">
                    <i class="bi bi-star-fill text-warning"></i> ${business.avgRating} <span>(${business.reviewCount})</span>
                </small>
            `;
            favouritesListElement.appendChild(favouriteCardElement);
        });
    }

    function renderReviews(reviewsListElement, reviews = []) {
        reviewsListElement.innerHTML = "";

        if (!reviews.length) {
            renderEmptyState(reviewsListElement, "No reviews yet.");
            return;
        }

        reviews.forEach((review) => {
            const reviewCardElement = document.createElement("article");
            reviewCardElement.className = "profile-card";
            const businessName = review.business?.name || "Unknown business";
            const businessId = review.business?._id;
            const businessLinkMarkup = businessId
                ? `<a href="/business/${businessId}">${businessName}</a>`
                : businessName;

            reviewCardElement.innerHTML = `
                <div class="profile-review-header">
                    <strong class="profile-card-title">${review.title}</strong>
                    <span class="profile-card-rating">
                        <i class="bi bi-star-fill text-warning"></i> ${review.rating}
                    </span>
                </div>
                <small class="profile-card-meta">${businessLinkMarkup}</small>
                <p class="profile-card-body mb-0">${review.body || "No written comment."}</p>
            `;

            reviewsListElement.appendChild(reviewCardElement);
        });
    }

    window.profileRenderers = {
        renderProfileHeader,
        renderFavourites,
        renderReviews,
        renderEmptyState
    };
}());