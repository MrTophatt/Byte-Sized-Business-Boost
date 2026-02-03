const id = BUSINESS_ID;
const userToken = localStorage.getItem("userToken");
const ratingElement = document.getElementById("rating");
const reviewCountElement = document.getElementById("review-count");
const favouriteCountElement = document.getElementById("favourite-count");
let reviews;

async function loadReviewStatistics() {
    const reviewsResponse = await fetch(`/api/reviews/${BUSINESS_ID}`);
    reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];

    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);
        ratingElement.textContent = averageRating;
        reviewCountElement.textContent = `(${reviews.length} reviews)`;
    } else {
        ratingElement.textContent = "0";
        reviewCountElement.textContent = "(0 reviews)";
    }
}

async function loadFavouriteStatistics() {
    const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
    if (!businessResponse.ok) throw new Error("Failed to fetch business");

    const business = await businessResponse.json();

    if (favouriteCountElement) {
        favouriteCountElement.textContent = `| ${business.favouritesCount} favourites`;
    }
}

/* =========================
   LOAD BUSINESS
========================= */
async function loadBusiness() {
    try {
        // Fetch the business data
        const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
        if (!businessResponse.ok) throw new Error("Failed to fetch business");
        
        const business = await businessResponse.json();

        // HERO IMAGE
        const heroImage = document.getElementById("hero-image");
        heroImage.src = business.imageUrl;
        heroImage.alt = business.name;

        // HEADER INFO
        document.getElementById("business-name").textContent = business.name;

        // Categories
        const categoriesContainer = document.getElementById("categories");
        categoriesContainer.innerHTML = business.categories
            .map(category => `<span class="badge bg-primary me-1">${category}</span>`)
            .join("");

        // Description
        document.getElementById("description").textContent = business.description;

        loadFavouriteStatistics()
        loadReviewStatistics()

        // Load reviews list
        if (typeof loadReviews === "function") {
            loadReviews(reviews); // Pass the reviews array to reuse
        }

        // Setup review posting box
        if (typeof setupReviewBox === "function") {
            setupReviewBox(BUSINESS_ID, userToken, async () => {
                // Refresh reviews and rating after posting
                const refreshedReviewsResponse = await fetch(`/api/reviews/${BUSINESS_ID}`);
                const refreshedReviews = refreshedReviewsResponse.ok ? await refreshedReviewsResponse.json() : [];

                // Update header stats
                if (refreshedReviews.length > 0) {
                    const totalRatingRefreshed = refreshedReviews.reduce((sum, review) => sum + review.rating, 0);
                    const averageRatingRefreshed = (totalRatingRefreshed / refreshedReviews.length).toFixed(1);
                    ratingElement.textContent = averageRatingRefreshed;
                    reviewCountElement.textContent = `(${refreshedReviews.length} reviews)`;
                } else {
                    ratingElement.textContent = "0";
                    reviewCountElement.textContent = "(0 reviews)";
                }

                // Reload the review list
                if (typeof loadReviews === "function") {
                    loadReviews(refreshedReviews);
                }
            });
        }

    } catch (error) {
        console.error(error);
    }
}

loadBusiness();