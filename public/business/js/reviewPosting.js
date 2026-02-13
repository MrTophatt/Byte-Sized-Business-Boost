/* =========================
   LOAD REVIEWS
========================= */
async function loadReviews() {
    try {
        const response = await fetch(`/api/reviews/${BUSINESS_ID}`);
        if (!response.ok) return;

        const reviews = await response.json();
        const reviewList = document.getElementById("review-list");

        if (reviews.length === 0) {
            reviewList.innerHTML = `<p class="">No reviews yet.</p>`;
            return;
        }

        // Helper to generate stars
        const renderStars = (rating) => {
            let starsHTML = "";
            for (let i = 1; i <= 5; i++) {
                if (rating >= i) {
                    starsHTML += `<i class="bi bi-star-fill text-warning"></i>`;
                } else if (rating >= i - 0.5) {
                    starsHTML += `<i class="bi bi-star-half text-warning"></i>`;
                } else {
                    starsHTML += `<i class="bi bi-star text-warning"></i>`;
                }
            }
            return starsHTML;
        };

        reviewList.innerHTML = reviews.map(review => {
            const user = review.user || {};
            const avatar = user.avatarUrl || "/images/defaultAvatar.png";
            const username = user.name || "Anonymous";

            // Limit the visible body to 200 characters, fade extra text
            const maxLength = 200;
            const shortBody = review.body.length > maxLength 
                ? review.body.slice(0, maxLength) 
                : review.body;
            const hasMore = review.body.length > maxLength;

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
                            ${hasMore ? `<span class="fade-text">... </span><a href="#" class="see-more">See more</a>` : ""}
                        </p>

                        <small class="text-muted">${new Date(review.createdAt).toLocaleDateString()}</small>
                    </div>
                </div>
            `;
        }).join("");

        // Add "See more" behavior
        document.querySelectorAll(".see-more").forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const p = e.target.closest(".review-body");
                p.textContent = p.textContent.replace("... See more", ""); // Show full text
            });
        });

    } catch (err) {
        console.error(err);
    }
}

/* =========================
   POST REVIEW
========================= */
async function setupReviewBox(businessId, userToken) {
    const reviewBox = document.getElementById("review-box");
    if (!reviewBox) return;

    // No token? Hide the box completely
    if (!userToken) {
        reviewBox.style.display = "none";
        return;
    }

    // Fetch the user role from your backend
    const userRes = await fetch("/api/users/me", {
        headers: { "x-user-token": userToken }
    });

    if (!userRes.ok) {
        reviewBox.style.display = "none";
        return;
    }

    const user = await userRes.json();

    // Hide review box for guest users
    if (user.role === "guest") {
        reviewBox.style.display = "none";
        return;
    }

    // Otherwise, show the box and attach post functionality
    reviewBox.style.display = "flex";

    const textarea = reviewBox.querySelector("textarea");
    const postButton = reviewBox.querySelector("button");

    // Add title + rating inputs if not already added
    if (!reviewBox.querySelector(".star-rating")) {
        reviewBox.insertAdjacentHTML("afterbegin", `
            <input class="review-title-input"
                placeholder="Review title"
                maxlength="40">

            <div class="star-rating mb-2" data-rating="0">
                ${[1,2,3,4,5].map(i => `
                    <span class="star" data-value="${i}">
                        <i class="bi bi-star text-warning"></i>
                    </span>
                `).join("")}
            </div>
        `);
    }

    const starContainer = reviewBox.querySelector(".star-rating");
    let selectedRating = 0;

    /* ---------- Render Stars ---------- */
    function renderStarRating(rating) {
        starContainer.querySelectorAll(".star").forEach(star => {
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

    /* ---------- Hover Preview ---------- */
    starContainer.addEventListener("mousemove", e => {
        const star = e.target.closest(".star");
        if (!star) return;

        const rect = star.getBoundingClientRect();
        const isHalf = (e.clientX - rect.left) < rect.width / 2;
        const value = Number(star.dataset.value) - (isHalf ? 0.5 : 0);

        renderStarRating(value);
    });

    /* ---------- Restore on Mouse Leave ---------- */
    starContainer.addEventListener("mouseleave", () => {
        renderStarRating(selectedRating);
    });

    /* ---------- Click to Set ---------- */
    starContainer.addEventListener("click", e => {
        const star = e.target.closest(".star");
        if (!star) return;

        const rect = star.getBoundingClientRect();
        const isHalf = (e.clientX - rect.left) < rect.width / 2;
        selectedRating = Number(star.dataset.value) - (isHalf ? 0.5 : 0);

        starContainer.dataset.rating = selectedRating;
        renderStarRating(selectedRating);
    });

    const titleInput = reviewBox.querySelector(".review-title-input");

    postButton.onclick = async () => {
        const body = textarea.value.trim();
        console.log(body)
        const title = titleInput.value.trim();
        const rating = Number(starContainer.dataset.rating);

        if (!title || rating <= 0) {
            alert("Title and rating are required.");
            return;
        }

        const res = await fetch(`/api/reviews/${businessId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-token": userToken
            },
            body: JSON.stringify({ title, body, rating })
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Failed to post review");
            return;
        }

        // Reset inputs
        textarea.value = "";
        titleInput.value = "";
        selectedRating = 0;
        starContainer.dataset.rating = 0;
        renderStarRating(0);

        // Reload reviews
        if (typeof loadReviews === "function") {
            loadReviews();
            loadReviewStatistics()
        }
    };
}