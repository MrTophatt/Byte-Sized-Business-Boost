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

    function renderFavourites(favouritesListElement, businesses = [], categories = []) {
        favouritesListElement.innerHTML = "";

        if (!businesses.length) {
            renderEmptyState(favouritesListElement, "No favourites yet.");
            return;
        }

        const toLabel = (value = "") => String(value)
            .replace(/[\-_]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
        const categoryIconByValue = new Map(
            (Array.isArray(categories) ? categories : []).map((category) => [category.value, category.icon])
        );

        businesses.forEach((business) => {
            const favouriteCategories = (business.categories || []).slice(0, 3);
            const categoryTagsMarkup = favouriteCategories
                .map((category) => {
                    const iconClass = categoryIconByValue.get(category);
                    const iconMarkup = iconClass
                        ? `<i class="bi ${iconClass} favourite-business-tag-icon" aria-hidden="true"></i>`
                        : "";

                    return `<span class="favourite-business-tag">${iconMarkup}${toLabel(category)}</span>`;
                })
                .join("");

            const favouriteCardElement = document.createElement("a");
            favouriteCardElement.className = "profile-card profile-card-link favourite-business-card";
            favouriteCardElement.href = `/business/${business._id}`;
            favouriteCardElement.innerHTML = `
                <div class="favourite-business-main">
                    <img
                        src="${business.logoImageUrl || "/images/defaultBusiness.png"}"
                        alt="${business.name} logo"
                        class="favourite-business-image"
                        loading="lazy"
                    >
                    <div class="favourite-business-content">
                        <div class="favourite-business-title-row">
                            <strong class="profile-card-title">${business.name}</strong>
                            <small class="favourite-business-owner">by ${business.ownerName || "Business owner"}</small>
                        </div>
                        <p class="favourite-business-description mb-0">${business.shortDescription || "Popular local business in your community."}</p>
                        <div class="favourite-business-tags">${categoryTagsMarkup}</div>
                    </div>
                </div>
                <div class="favourite-business-stats" aria-label="Business stats">
                    <small class="favourite-business-stat">
                        <i class="bi bi-heart"></i> ${business.favouritesCount || 0}
                    </small>
                    <small class="favourite-business-stat">
                        <i class="bi bi-star-fill"></i> ${business.avgRating} <span>(${business.reviewCount})</span>
                    </small>
                </div>
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

        const renderStars = (ratingValue) => {
            const roundedRating = Math.max(1, Math.min(5, Math.round(Number(ratingValue) || 0)));
            return '<i class="bi bi-star-fill"></i>'.repeat(roundedRating)
                + '<i class="bi bi-star"></i>'.repeat(5 - roundedRating);
        };

        reviews.forEach((review) => {
            const businessName = review.business?.name || "Unknown business";
            const businessId = review.business?._id;
            const cardElement = businessId
                ? document.createElement("a")
                : document.createElement("article");

            cardElement.className = "profile-card profile-review-card";
            if (businessId) {
                cardElement.href = `/business/${businessId}`;
                cardElement.classList.add("profile-review-link-card");
            }

            const reviewBody = review.body || "No written comment.";
            const reviewTitle = review.title || "Review";
            const ratingValue = Number(review.rating) || 0;
            const formattedDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString()
                : "";

            cardElement.innerHTML = `
                <div class="profile-review-business-row">
                    <span class="profile-review-business-label">Business</span>
                    <span class="profile-review-business-name">${businessName}</span>
                    ${formattedDate ? `<small class="profile-review-date ms-auto">${formattedDate}</small>` : ""}
                </div>

                <div class="profile-review-header">
                    <strong class="profile-card-title">${reviewTitle}</strong>
                    <span class="profile-review-rating" aria-label="${ratingValue} out of 5 stars">
                        ${renderStars(ratingValue)}
                        <span class="profile-review-rating-value">${ratingValue}</span>
                    </span>
                </div>

                <p class="profile-card-body mb-0">${reviewBody}</p>
            `;

            reviewsListElement.appendChild(cardElement);
        });
    }

    window.profileRenderers = {
        renderProfileHeader,
        renderFavourites,
        renderReviews,
        renderEmptyState
    };
}());