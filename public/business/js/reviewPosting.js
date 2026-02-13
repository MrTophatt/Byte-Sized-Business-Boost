const STAR_OPTIONS = [1, 2, 3, 4, 5];
const REVIEW_PREVIEW_MAX_LENGTH = 200;

/**
 * Builds a star icon row for a numeric rating value.
 * @param {number} rating - Rating value between 0 and 5 (supports halves).
 * @returns {string} HTML string containing Bootstrap star icons.
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
 * Loads reviews for the current business and renders cards into #review-list.
 * @returns {Promise<void>}
 */
async function loadReviews() {
    try {
        const response = await fetch(`/api/reviews/${BUSINESS_ID}`);
        if (!response.ok) return;

        const reviews = await response.json();
        const reviewList = document.getElementById("review-list");

        if (reviews.length === 0) {
            reviewList.innerHTML = '<p class="text-muted">No reviews yet.</p>';
            return;
        }

        reviewList.innerHTML = reviews.map((review) => {
            const user = review.user || {};
            const avatar = user.avatarUrl || "/images/defaultAvatar.png";
            const username = user.name || "Anonymous";

            const shortBody = review.body.length > REVIEW_PREVIEW_MAX_LENGTH
                ? review.body.slice(0, REVIEW_PREVIEW_MAX_LENGTH)
                : review.body;
            const hasMore = review.body.length > REVIEW_PREVIEW_MAX_LENGTH;

            return `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <img src="${avatar}" alt="${username}" class="rounded-circle me-2" width="40" height="40">
                            <strong>${username}</strong>
                            <span class="ms-auto">${renderStars(review.rating)}</span>
                        </div>

                        <h6 class="fw-bold">${review.title}</h6>

                        <p class="review-body mb-2">
                            ${shortBody}
                            ${hasMore ? '<span class="fade-text">... </span><a href="#" class="see-more">See more</a>' : ""}
                        </p>

                        <small class="text-muted">${new Date(review.createdAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `;
        }).join("");

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

/**
 * Sets up the review composer box and posting behavior for authenticated users.
 * @param {string} businessId - Business document id.
 * @param {string} userToken - Session token used for API authorization.
 * @returns {Promise<void>}
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

    reviewBox.style.display = "flex";

    const textarea = reviewBox.querySelector("textarea");
    const postButton = reviewBox.querySelector("button");

    if (!reviewBox.querySelector(".star-rating")) {
        reviewBox.insertAdjacentHTML("afterbegin", `
            <input class="review-title-input"
                placeholder="Review title"
                maxlength="40">

            <div class="star-rating mb-2" data-rating="0">
                ${STAR_OPTIONS.map((value) => `
                    <span class="star" data-value="${value}">
                        <i class="bi bi-star text-warning"></i>
                    </span>
                `).join("")}
            </div>
        `);
    }

    const starContainer = reviewBox.querySelector(".star-rating");
    let selectedRating = 0;

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

        starContainer.dataset.rating = selectedRating;
        renderStarRating(selectedRating);
    });

    const titleInput = reviewBox.querySelector(".review-title-input");

    postButton.onclick = async () => {
        const body = textarea.value.trim();
        const title = titleInput.value.trim();
        const rating = Number(starContainer.dataset.rating);

        if (!title || rating <= 0) {
            alert("Title and rating are required.");
            return;
        }

        const response = await fetch(`/api/reviews/${businessId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-token": userToken
            },
            body: JSON.stringify({ title, body, rating })
        });

        if (!response.ok) {
            const data = await response.json();
            alert(data.error || "Failed to post review");
            return;
        }

        textarea.value = "";
        titleInput.value = "";
        selectedRating = 0;
        starContainer.dataset.rating = 0;
        renderStarRating(0);

        if (typeof loadReviews === "function") {
            loadReviews();
            loadReviewStatistics();
        }
    };
}