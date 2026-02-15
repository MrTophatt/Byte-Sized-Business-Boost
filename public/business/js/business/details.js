const RATING_ELEMENT = document.getElementById("rating");
const REVIEW_COUNT_ELEMENT = document.getElementById("review-count");
const FAV_COUNT_ELEMENT = document.getElementById("favourite-count");

const {
    fetchBusiness,
    fetchReviews
} = window.businessDetailApi;

const {
    renderTopSummary,
    renderContactInfo,
    setupShareButton,
    renderTimetable,
    renderRunningDeals,
    renderReviewBreakdown,
    renderBusinessHeader
} = window.businessDetailRenderers;

/**
 * Fetches review statistics and updates the average, review count, and star breakdown.
 * @returns {Promise<void>}
 */
async function loadReviewStatistics() {
    const reviews = await fetchReviews();

    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);
        RATING_ELEMENT.textContent = averageRating;
        REVIEW_COUNT_ELEMENT.textContent = `(${reviews.length} reviews)`;
    } else {
        RATING_ELEMENT.textContent = "0";
        REVIEW_COUNT_ELEMENT.textContent = "(0 reviews)";
    }

    renderReviewBreakdown(reviews);
}

/**
 * Fetches favourite data and updates the header metric.
 * @returns {Promise<void>}
 */
async function loadFavouriteStatistics() {
    const business = await fetchBusiness();

    if (FAV_COUNT_ELEMENT) {
        FAV_COUNT_ELEMENT.textContent = `| ${business.favouritesCount} favourites`;
    }
}

/**
 * Loads business details and renders all sections on the business detail page.
 * @returns {Promise<void>}
 */
async function loadBusiness() {
    try {
        const business = await fetchBusiness();

        renderBusinessHeader(business);
        renderTopSummary(business);
        renderContactInfo(business);
        setupShareButton(business);
        renderTimetable(business.timetable);
        renderRunningDeals(business.deals || []);

        await Promise.all([loadFavouriteStatistics(), loadReviewStatistics()]);

        if (typeof setupReviewBox === "function") {
            await setupReviewBox(BUSINESS_ID, userToken);
        }

        if (typeof loadReviews === "function") {
            await loadReviews();
        }
    } catch (error) {
        console.error(error);
    }
}

loadBusiness();