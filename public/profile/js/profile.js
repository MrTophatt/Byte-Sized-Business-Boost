// Retrieve the user authentication token from localStorage
const USER_TOKEN = localStorage.getItem("userToken");

// DOM containers used for rendering profile sections
const FAV_LIST_ELEMENTS = document.getElementById("favouritesList");
const REVIEWS_LIST_ELEMENT = document.getElementById("reviewsList");

// Utility functions related to profile routing and formatting
const {
    getViewedUserIdFromPath
} = window.profileUtils;

// API functions used to retrieve profile-related data
const {
    fetchViewer,
    fetchUserById,
    fetchBusinessesByIds,
    fetchCategories,
    fetchReviewsByUser
} = window.profileApi;

// Rendering functions responsible for updating the DOM
const {
    renderProfileHeader,
    renderFavourites,
    renderReviews,
    renderEmptyState
} = window.profileRenderers;

/**
 * Main entry point for loading the profile page.
 * Handles authentication, data fetching, and rendering.
 */
async function loadProfile() {

    // If no auth token exists, redirect to login immediately
    if (!USER_TOKEN) {
        window.location.href = "/login";
        return;
    }

    try {
        // Determine whether the user is viewing their own profile
        // or someone else's profile
        const viewedUserId = getViewedUserIdFromPath();

        // Fetch the authenticated viewer
        const viewer = await fetchViewer();

        // If viewing another user, fetch that user; otherwise reuse viewer data
        const viewedUser = viewedUserId
            ? await fetchUserById(viewedUserId)
            : viewer;

        // Render the profile header section
        renderProfileHeader(viewer, viewedUser, USER_TOKEN);

        // Load favourites and reviews in parallel
        await Promise.all([
            loadFavourites(viewedUser.favourites),
            loadReviews(viewedUser._id)
        ]);

    } catch (error) {
        // Any failure is treated as an authentication or session error
        console.error(error);
        localStorage.removeItem("userToken");
        window.location.href = "/login";
    }
}

/**
 * Loads and renders the user's favourite businesses.
 *
 * @param {Array<string>} favourites - List of business IDs
 */
async function loadFavourites(favourites = []) {

    // If no favourites exist, render an empty state
    if (!favourites.length) {
        renderEmptyState(FAV_LIST_ELEMENTS, "No favourites yet.");
        return;
    }

    try {
        // Fetch businesses and categories concurrently
        const [businesses, categories] = await Promise.all([
            fetchBusinessesByIds(favourites),
            fetchCategories()
        ]);

        renderFavourites(FAV_LIST_ELEMENTS, businesses, categories);

    } catch (error) {
        console.error(error);
        renderEmptyState(FAV_LIST_ELEMENTS, "Unable to load favourites.");
    }
}

/**
 * Loads and renders reviews for a given user.
 *
 * @param {string} userId - User whose reviews should be displayed
 */
async function loadReviews(userId) {
    try {
        const reviews = await fetchReviewsByUser(userId);

        // Ensure reviews is always treated as an array
        renderReviews(
            REVIEWS_LIST_ELEMENT,
            Array.isArray(reviews) ? reviews : []
        );

    } catch (error) {
        console.error(error);
        renderEmptyState(REVIEWS_LIST_ELEMENT, "Unable to load reviews.");
    }
}

// Start profile loading immediately on script execution
loadProfile();