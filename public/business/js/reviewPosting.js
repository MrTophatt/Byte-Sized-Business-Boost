const STAR_OPTIONS = [1, 2, 3, 4, 5]; // Allowed star rating values. Used to generate the interactive star input widget.
const REVIEW_PREVIEW_MAX_LENGTH = 200; // Maximum number of characters shown in review previews before truncation and "See more".
let currentReviewUserId = null; // Stores the current authenticated user's ID so their review can be prioritized and styled.

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
            const profileLink = user._id ? `/profile/${user._id}` : null;

            const usernameMarkup = profileLink
                ? `<a href="${profileLink}" class="review-user-link">${username}</a>`
                : username;

            // Truncate long review bodies for preview
            const shortBody = review.body.length > REVIEW_PREVIEW_MAX_LENGTH
                ? review.body.slice(0, REVIEW_PREVIEW_MAX_LENGTH)
                : review.body;

            const hasMore = review.body.length > REVIEW_PREVIEW_MAX_LENGTH;
            const isCurrentUserReview =
                currentReviewUserId && review.user?._id === currentReviewUserId;

            return `
                <article class="review-card ${isCurrentUserReview ? "review-card-owner" : ""}">
                    <div class="review-header">
                        <img src="${avatar}" alt="${username}" class="review-avatar">
                        <strong class="review-user-name">${usernameMarkup}</strong>
                        <span class="review-rating ms-auto">${renderStars(review.rating)}</span>
                    </div>

                    <h6 class="review-title">${review.title}</h6>

                    <p class="review-body review-comment mb-2">
                        ${shortBody}
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
                reviewBody.textContent = reviewBody.textContent.replace("... See more", "");
            });
        });
    } catch (error) {
        console.error(error);
    }
}