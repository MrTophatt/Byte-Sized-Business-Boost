(function registerProfileRenderers() {

    // Constants used across profile rendering
    const { DEFAULT_AVATAR_URL, GUEST_ROLE } = window.profileConstants;

    // Utility helpers used for formatting
    const { getHueFromToken, getFirstName } = window.profileUtils;

    /**
     * Renders a simple empty-state message inside a container.
     */
    function renderEmptyState(container, text) {
        container.innerHTML = `<div class="profile-empty-state">${text}</div>`;
    }

    /**
     * Creates a styled label element used for section headings.
     */
    function createSectionLabel(text) {
        const sectionLabelElement = document.createElement("span");
        sectionLabelElement.className = "profile-section-label";
        sectionLabelElement.textContent = text;
        return sectionLabelElement;
    }

    const PROFILE_REVIEW_PREVIEW_MAX_LENGTH = 220;

    function escapeHtml(value = "") {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function formatReviewText(value = "") {
        return escapeHtml(value).replaceAll("\n", "<br>");
    }


    /**
     * Renders the profile header section including:
     * - Avatars
     * - Name and email
     * - Role badges
     * - Page title
     * - Section headings
     */
    function renderProfileHeader(viewer, viewedUser, userToken) {

        // Determine if the viewer is looking at their own profile
        const isOwnProfile = String(viewer._id) === String(viewedUser._id);

        // Cache DOM elements used by the header
        const avatarElement = document.getElementById("avatar");
        const profileAvatarElement = document.getElementById("profileAvatar");
        const roleBadgeElement = document.getElementById("roleBadge");
        const profileNameElement = document.getElementById("profileName");
        const profileEmailElement = document.getElementById("profileEmail");
        const profileContextElement = document.getElementById("profileContext");
        const favouritesHeadingElement = document.getElementById("favouritesHeading");
        const reviewsHeadingElement = document.getElementById("reviewsHeading");

        // Set viewer avatar
        avatarElement.src = viewer.avatarUrl || DEFAULT_AVATAR_URL;
        avatarElement.alt = viewer.name || "User avatar";

        // Set profile avatar
        profileAvatarElement.src = viewedUser.avatarUrl || DEFAULT_AVATAR_URL;
        profileAvatarElement.alt = viewedUser.name || "User avatar";

        // Populate name and email fields
        profileNameElement.textContent = viewedUser.name || "Guest";
        profileEmailElement.textContent = viewedUser.email || (isOwnProfile ? "" : "Email hidden");

        // Apply special styling for guest users
        if (viewer.role === GUEST_ROLE) {
            avatarElement.style.filter = `hue-rotate(${getHueFromToken(userToken)}deg) saturate(20)`;
            roleBadgeElement.style.display = "inline-block";
        } else {
            avatarElement.style.filter = "";
            roleBadgeElement.style.display = "none";
        }

        // Apply color-derived styling for viewed guest users
        if (viewedUser.role === GUEST_ROLE) {
            profileAvatarElement.style.filter = `hue-rotate(${getHueFromToken(String(viewedUser._id))}deg) saturate(20)`;
        } else {
            profileAvatarElement.style.filter = "";
        }

        // Update browser tab title
        document.title = `${profileNameElement.textContent} | Profile`;

        // Render profile context label
        profileContextElement.innerHTML = "";
        profileContextElement.appendChild(
            createSectionLabel(isOwnProfile ? "Your Profile" : "Community Profile")
        );

        const firstName = getFirstName(profileNameElement.textContent);

        // Update section headings based on ownership
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

        const formatBusinessContext = (business = {}) => {
            const categories = Array.isArray(business.categories)
                ? business.categories
                    .map((category) => String(category || "").trim())
                    .filter(Boolean)
                    .map((category) => category.charAt(0).toUpperCase() + category.slice(1))
                : [];

            const primaryCategory = categories[0] || "Local business";
            const locationHint = String(business.address || "").trim();

            return locationHint
                ? `${primaryCategory} · ${locationHint}`
                : primaryCategory;
        };

        reviews.forEach((review) => {
            const businessName = review.business?.name || "Unknown business";
            const businessContext = formatBusinessContext(review.business);
            const businessId = review.business?._id;
            const cardElement = businessId
                ? document.createElement("a")
                : document.createElement("article");

            cardElement.className = "profile-card profile-review-card";
            if (businessId) {
                cardElement.href = `/business/${businessId}`;
                cardElement.classList.add("profile-review-link-card");
            }

            const reviewBody = String(review.body || "No written comment.");
            const reviewTitle = review.title || "Review";
            const ratingValue = Number(review.rating) || 0;
            const formattedDate = review.createdAt
                ? new Date(review.createdAt).toLocaleDateString()
                : "";
            const truncatedBody = reviewBody.slice(0, PROFILE_REVIEW_PREVIEW_MAX_LENGTH);
            const hasMore = reviewBody.length > PROFILE_REVIEW_PREVIEW_MAX_LENGTH;
            const encodedFullBody = encodeURIComponent(reviewBody);
            const encodedShortBody = encodeURIComponent(truncatedBody);

            cardElement.innerHTML = `
                <div class="profile-review-business-row">
                    <span class="profile-review-business-name">${escapeHtml(businessName)}</span>
                    <small class="profile-review-business-context">${escapeHtml(businessContext)}</small>
                    ${formattedDate ? `<small class="profile-review-date ms-auto">${formattedDate}</small>` : ""}
                </div>

                <div class="profile-review-header">
                    <strong class="profile-card-title">${escapeHtml(reviewTitle)}</strong>
                    <span class="profile-review-rating" aria-label="${ratingValue} out of 5 stars">
                        ${renderStars(ratingValue)}
                        <span class="profile-review-rating-value">${ratingValue}</span>
                    </span>
                </div>

                <p
                    class="profile-card-body mb-0"
                    data-expanded="false"
                    data-full-body="${encodedFullBody}"
                    data-short-body="${encodedShortBody}"
                >
                    <span class="profile-review-body-text">${formatReviewText(hasMore ? truncatedBody : reviewBody)}</span>
                    ${hasMore ? '<span class="profile-review-fade">... </span><a href="#" class="profile-review-see-more">See more</a>' : ""}
                </p>
            `;

            reviewsListElement.appendChild(cardElement);
        });

        reviewsListElement.querySelectorAll(".profile-review-see-more").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();

                const reviewBodyElement = event.target.closest(".profile-card-body");
                const bodyTextElement = reviewBodyElement?.querySelector(".profile-review-body-text");
                if (!reviewBodyElement || !bodyTextElement) return;

                const expanded = reviewBodyElement.dataset.expanded === "true";
                const fullBody = decodeURIComponent(reviewBodyElement.dataset.fullBody || "");
                const shortBody = decodeURIComponent(reviewBodyElement.dataset.shortBody || "");
                const fadeElement = reviewBodyElement.querySelector(".profile-review-fade");

                if (expanded) {
                    bodyTextElement.innerHTML = formatReviewText(shortBody);
                    if (fadeElement) fadeElement.style.display = "inline";
                    event.target.textContent = "See more";
                    reviewBodyElement.dataset.expanded = "false";
                } else {
                    bodyTextElement.innerHTML = formatReviewText(fullBody);
                    if (fadeElement) fadeElement.style.display = "none";
                    event.target.textContent = "See less";
                    reviewBodyElement.dataset.expanded = "true";
                }
            });
        });
    }

    window.profileRenderers = {
        renderProfileHeader,
        renderFavourites,
        renderReviews,
        renderEmptyState
    };
    console.log(window.profileRenderers)
}());