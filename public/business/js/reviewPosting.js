const STAR_OPTIONS = [1, 2, 3, 4, 5]; // Allowed star rating values. Used to generate the interactive star input widget.
const REVIEW_PREVIEW_MAX_LENGTH = 200; // Maximum number of characters shown in review previews before truncation and "See more".
const REVIEW_TITLE_MAX_LENGTH = 60; // Maximum length of characters the title of any review can be.
const REVIEW_BODY_MAX_LENGTH = 1000; // Maximum length of characters the body of any review can be.
let currentReviewUserId = null; // Stores the current authenticated user's ID so their review can be prioritized and styled.

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
 * Builds a star icon row for a numeric rating value.
 * Supports half-star rendering.
 *
 * @param {number} rating - Rating value between 0 and 5.
 * @returns {string} HTML string of Bootstrap star icons.
 */
function renderStars(rating) {
    let starsHtml = "";

    for (let i = 1; i <= 5; i += 1) {
        if (rating >= i) {
            starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
        } else if (rating >= i - 0.5) {
            starsHtml += '<i class="bi bi-star-half text-warning"></i>';
        } else {
            starsHtml += '<i class="bi bi-star text-warning"></i>';
        }
    }

    return starsHtml;
}

/**
 * Fetches reviews for the current business and renders them.
 * The current user's review (if present) is prioritized at the top.
 *
 * @returns {Promise<void>}
 */
async function loadReviews() {
    try {
        const response = await fetch(`/api/reviews/${BUSINESS_ID}`);
        if (!response.ok) return;

        const reviews = await response.json();
        const reviewList = document.getElementById("review-list");

        // Clone and reorder so the user's own review appears first
        const prioritizedReviews = [...reviews];
        if (currentReviewUserId) {
            const myReviewIndex = prioritizedReviews.findIndex(
                (review) => review.user?._id === currentReviewUserId
            );

            if (myReviewIndex > 0) {
                const [myReview] = prioritizedReviews.splice(myReviewIndex, 1);
                prioritizedReviews.unshift(myReview);
            }
        }

        if (prioritizedReviews.length === 0) {
            reviewList.innerHTML = "<p>No reviews yet.</p>";
            return;
        }

        reviewList.innerHTML = prioritizedReviews.map((review) => {
            const user = review.user || {};
            const avatar = user.avatarUrl || "/images/defaultAvatar.png";
            const username = user.name || "Anonymous";
            const profileLink = user._id ? `/profile/${encodeURIComponent(user._id)}` : null;

            const usernameMarkup = profileLink
                ? `<a href="${profileLink}" class="review-user-link">${username}</a>`
                : username;

            // Truncate long review bodies for preview
            const body = String(review.body || "");
            const truncatedBody = body.slice(0, REVIEW_PREVIEW_MAX_LENGTH);

            const hasMore = body.length > REVIEW_PREVIEW_MAX_LENGTH;
            const isCurrentUserReview = currentReviewUserId && review.user?._id === currentReviewUserId;

            const encodedFullBody = encodeURIComponent(body);
            const encodedShortBody = encodeURIComponent(truncatedBody);

            return `
                <article class="review-card ${isCurrentUserReview ? "review-card-owner" : ""}">
                    <div class="review-header">
                        <img src="${avatar}" alt="${username}" class="review-avatar">
                        <strong class="review-user-name">${usernameMarkup}</strong>
                        <span class="review-rating ms-auto">${renderStars(review.rating)}</span>
                    </div>

                    <h6 class="review-title">${escapeHtml(review.title || "")}</h6>

                    <p
                        class="review-body review-comment mb-2"
                        data-expanded="false"
                        data-full-body="${encodedFullBody}"
                        data-short-body="${encodedShortBody}"
                    >
                        <span class="review-body-text">${formatReviewText(hasMore ? truncatedBody : body)}</span>
                        ${hasMore ? '<span class="fade-text">... </span><a href="#" class="see-more">See more</a>' : ""}
                    </p>

                    <small class="review-date">
                        ${new Date(review.createdAt).toLocaleDateString()}
                    </small>
                </article>
            `;
        }).join("");

        // Expand truncated reviews when "See more" is clicked
        document.querySelectorAll(".see-more").forEach((link) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();

                const reviewBody = event.target.closest(".review-body");
                const bodyText = reviewBody?.querySelector(".review-body-text");
                if (!reviewBody || !bodyText) return;

                const expanded = reviewBody.dataset.expanded === "true";
                const fullBody = decodeURIComponent(reviewBody.dataset.fullBody || "");
                const shortBody = decodeURIComponent(reviewBody.dataset.shortBody || "");
                const fadeText = reviewBody.querySelector(".fade-text");

                if (expanded) {
                    bodyText.innerHTML = formatReviewText(shortBody);
                    if (fadeText) fadeText.style.display = "inline";
                    event.target.textContent = "See more";
                    reviewBody.dataset.expanded = "false";
                } else {
                    bodyText.innerHTML = formatReviewText(fullBody);
                    if (fadeText) fadeText.style.display = "none";
                    event.target.textContent = "See less";
                    reviewBody.dataset.expanded = "true";
                }
            });
        });
    } catch (error) {
        console.error(error);
    }
}


/**
 * Sets up the review composer box and posting behavior for authenticated users.
 * @param {string} businessId Identifier used to look up the target record.
 * @param {string} userToken Authentication or session token used to identify the current user.
 * @returns {Promise<void>} Updates UI or local state via side effects.
 */
async function setupReviewBox(businessId, userToken) {
    const reviewBox = document.getElementById("review-box");
    if (!reviewBox) return;

    if (!userToken) {
        reviewBox.style.display = "none";
        return;
    }

    const userResponse = await fetch("/api/users/me", {
        headers: { "x-user-token": userToken }
    });

    if (!userResponse.ok) {
        reviewBox.style.display = "none";
        return;
    }

    const user = await userResponse.json();

    if (user.role === "guest") {
        reviewBox.style.display = "none";
        return;
    }

    currentReviewUserId = user._id ? String(user._id) : null;

    const existingReviewResponse = await fetch(`/api/reviews/${businessId}`);
    if (!existingReviewResponse.ok) {
        reviewBox.style.display = "none";
        return;
    }

    const existingReviews = await existingReviewResponse.json();
    const hasExistingReview = existingReviews.some((review) => review.user?._id === currentReviewUserId);

    if (hasExistingReview) {
        reviewBox.style.display = "none";
        return;
    }

    reviewBox.style.display = "flex";

    const textarea = reviewBox.querySelector("textarea");
    const postButton = reviewBox.querySelector("button");

    if (!textarea || !postButton) {
        reviewBox.style.display = "none";
        return;
    }

    textarea.maxLength = REVIEW_BODY_MAX_LENGTH;

    if (!reviewBox.querySelector(".star-rating")) {
        reviewBox.insertAdjacentHTML("afterbegin", `
            <div class="star-rating mb-2" data-rating="0" aria-label="Select review rating">
                ${STAR_OPTIONS.map((value) => `
                    <span class="star" data-value="${value}">
                        <i class="bi bi-star text-warning"></i>
                    </span>
                `).join("")}
            </div>

            <input class="review-title-input"
                placeholder="Review title"
                maxlength="${REVIEW_TITLE_MAX_LENGTH}">
        `);
    }

    const starContainer = reviewBox.querySelector(".star-rating");
    const titleInput = reviewBox.querySelector(".review-title-input");
    const ensureCounterInsideField = (field, counterClass, maxLength, wrapClass) => {
        let wrapper = field.closest(".review-field-wrap");
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.className = `review-field-wrap ${wrapClass}`;
            field.parentNode.insertBefore(wrapper, field);
            wrapper.appendChild(field);
        }

        field.classList.add("with-counter");

        let counter = wrapper.querySelector(`.${counterClass}`);
        if (!counter) {
            counter = document.createElement("small");
            counter.className = `review-counter ${counterClass}`;
            wrapper.appendChild(counter);
        }

        counter.textContent = `${field.value.length}/${maxLength}`;
        return counter;
    };

    const titleCounter = ensureCounterInsideField(
        titleInput,
        "review-title-counter",
        REVIEW_TITLE_MAX_LENGTH,
        "review-title-wrap"
    );
    const bodyCounter = ensureCounterInsideField(
        textarea,
        "review-body-counter",
        REVIEW_BODY_MAX_LENGTH,
        "review-body-wrap"
    );

    let selectedRating = 0;

     const isHalfStepRating = (value) => (
        Number.isFinite(value)
        && value >= 1
        && value <= 5
        && Number.isInteger(value * 2)
    );

    const updateCounters = () => {
        if (titleCounter) {
            titleCounter.textContent = `${titleInput.value.length}/${REVIEW_TITLE_MAX_LENGTH}`;
        }

        if (bodyCounter) {
            bodyCounter.textContent = `${textarea.value.length}/${REVIEW_BODY_MAX_LENGTH}`;
        }
    };

    /**
     * Updates the star input widget to reflect hover/selected state.
     * @param {number} rating - Target visual rating to render.
     * @returns {void}
     */
    function renderStarRating(rating) {
        starContainer.querySelectorAll(".star").forEach((star) => {
            const value = Number(star.dataset.value);
            const icon = star.querySelector("i");

            if (rating >= value) {
                icon.className = "bi bi-star-fill text-warning";
            } else if (rating >= value - 0.5) {
                icon.className = "bi bi-star-half text-warning";
            } else {
                icon.className = "bi bi-star text-warning";
            }
        });
    }

    starContainer.addEventListener("mousemove", (event) => {
        const star = event.target.closest(".star");
        if (!star) return;

        const rect = star.getBoundingClientRect();
        const isHalf = (event.clientX - rect.left) < rect.width / 2;
        const value = Number(star.dataset.value) - (isHalf ? 0.5 : 0);

        renderStarRating(value);
    });

    starContainer.addEventListener("mouseleave", () => {
        renderStarRating(selectedRating);
    });

    starContainer.addEventListener("click", (event) => {
        const star = event.target.closest(".star");
        if (!star) return;

        const rect = star.getBoundingClientRect();
        const isHalf = (event.clientX - rect.left) < rect.width / 2;
        selectedRating = Number(star.dataset.value) - (isHalf ? 0.5 : 0);

        starContainer.dataset.rating = String(selectedRating);
        renderStarRating(selectedRating);
    });

    titleInput.addEventListener("input", updateCounters);
    textarea.addEventListener("input", updateCounters);
    updateCounters();

    postButton.onclick = async () => {
        const body = textarea.value.trim();
        const title = titleInput.value.trim();
        const rating = Number(starContainer.dataset.rating);

        if (!title) {
            alert("Review title is required.");
            return;
        }

        if (title.length > REVIEW_TITLE_MAX_LENGTH) {
            alert(`Title must be ${REVIEW_TITLE_MAX_LENGTH} characters or fewer.`);
            return;
        }

        if (body.length > REVIEW_BODY_MAX_LENGTH) {
            alert(`Review body must be ${REVIEW_BODY_MAX_LENGTH} characters or fewer.`);
            return;
        }

        if (!isHalfStepRating(rating)) {
            alert("Select a rating between 1 and 5 (half-star increments allowed).");
            return;
        }

        postButton.disabled = true;

        try {
            const response = await fetch(`/api/reviews/${businessId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-token": userToken
                },
                body: JSON.stringify({ title, body, rating })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.error || "Failed to post review");
                return;
            }

            textarea.value = "";
            titleInput.value = "";
            selectedRating = 0;
            starContainer.dataset.rating = "0";
            renderStarRating(0);
            updateCounters();

            reviewBox.style.display = "none";

            if (typeof loadReviews === "function") {
                await loadReviews();
                await loadReviewStatistics();
            }
        } finally {
            postButton.disabled = false;
        }
    };
}