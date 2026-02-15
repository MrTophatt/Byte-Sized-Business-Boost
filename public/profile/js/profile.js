const USER_TOKEN = localStorage.getItem("userToken");
const FAV_LIST_ELEMENTS = document.getElementById("favouritesList");
const REVIEWS_LIST_ELEMENT = document.getElementById("reviewsList");

const {
    getViewedUserIdFromPath
} = window.profileUtils;

const {
    fetchViewer,
    fetchUserById,
    fetchBusinessesByIds,
    fetchReviewsByUser
} = window.profileApi;

const {
    renderProfileHeader,
    renderFavourites,
    renderReviews,
    renderEmptyState
} = window.profileRenderers;

async function loadProfile() {
    if (!USER_TOKEN) {
        window.location.href = "/login";
        return;
    }

    try {
        const viewedUserId = getViewedUserIdFromPath();
        const viewer = await fetchViewer();
        const viewedUser = viewedUserId ? await fetchUserById(viewedUserId) : viewer;

        renderProfileHeader(viewer, viewedUser, USER_TOKEN);

        await Promise.all([
            loadFavourites(viewedUser.favourites),
            loadReviews(viewedUser._id)
        ]);
    } catch (error) {
        console.error(error);
        localStorage.removeItem("userToken");
        window.location.href = "/login";
    }
}

async function loadFavourites(favourites = []) {
    if (!favourites.length) {
        renderEmptyState(FAV_LIST_ELEMENTS, "No favourites yet.");
        return;
    }

    try {
        const businesses = await fetchBusinessesByIds(favourites);
        renderFavourites(FAV_LIST_ELEMENTS, businesses);
    } catch (error) {
        console.error(error);
        renderEmptyState(FAV_LIST_ELEMENTS, "Unable to load favourites.");
    }
}

async function loadReviews(userId) {
    try {
        const reviews = await fetchReviewsByUser(userId);
        renderReviews(REVIEWS_LIST_ELEMENT, Array.isArray(reviews) ? reviews : []);
    } catch (error) {
        console.error(error);
        renderEmptyState(REVIEWS_LIST_ELEMENT, "Unable to load reviews.");
    }
}

loadProfile();