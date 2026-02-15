// Immediately-invoked function expression (IIFE)
// Purpose: encapsulate profile API logic and avoid polluting the global scope
(function registerProfileApi() {

    // Retrieve the currently stored user authentication token
    // This token is expected to be used for authenticated API requests
    const userToken = localStorage.getItem("userToken");

    /**
     * Performs a fetch request with the user authentication token attached.
     * Throws an error if the response is not successful.
     *
     * @param {string} url - API endpoint to request
     * @returns {Promise<any>} Parsed JSON response body
     */
    async function fetchWithAuth(url) {
        const response = await fetch(url, {
            headers: {
                // Custom header used by the backend to authenticate the user
                "x-user-token": userToken
            }
        });

        // If HTTP status is outside the 200–299 range, treat as failure
        if (!response.ok) {
            throw new Error(`Request failed (${response.status}): ${url}`);
        }

        // Parse and return the JSON response body
        return response.json();
    }

    /**
     * Fetches the currently authenticated user ("viewer").
     * This does not depend on the profile being viewed.
     */
    async function fetchViewer() {
        return fetchWithAuth("/api/users/me");
    }

    /**
     * Fetches a user profile by ID.
     *
     * @param {string} userId - ID of the user to fetch
     */
    async function fetchUserById(userId) {
        return fetchWithAuth(`/api/users/${userId}`);
    }

    /**
     * Fetches business objects by a list of IDs.
     * IDs are deduplicated and normalized before being sent to the backend.
     *
     * @param {Array<string|number>} ids - Business IDs
     * @returns {Promise<Array>} List of business objects
     */
    async function fetchBusinessesByIds(ids = []) {

        // Guard clause: invalid or empty input results in no fetch
        if (!Array.isArray(ids) || !ids.length) {
            return [];
        }

        // Normalize IDs:
        // - Convert all IDs to strings
        // - Remove falsy values
        // - Remove duplicates using a Set
        const uniqueIds = [...new Set(
            ids.map((id) => String(id)).filter(Boolean)
        )];

        // Encode IDs into a comma-separated query string
        const query = encodeURIComponent(uniqueIds.join(","));

        const response = await fetch(`/api/businesses?ids=${query}`);

        if (!response.ok) {
            throw new Error("Unable to load businesses");
        }

        return response.json();
    }

    /**
     * Fetches all available business categories.
     */
    async function fetchCategories() {
        const response = await fetch("/api/categories");

        if (!response.ok) {
            throw new Error("Unable to load categories");
        }

        return response.json();
    }

    /**
     * Fetches reviews written by a specific user.
     * If no userId is provided, fetches reviews for the current viewer.
     *
     * @param {string|null} userId - Optional user ID
     */
    async function fetchReviewsByUser(userId) {

        // If no userId is provided, default to the authenticated user's reviews
        if (!userId) {
            return fetchWithAuth("/api/reviews/me");
        }

        return fetchWithAuth(`/api/reviews/user/${userId}`);
    }

    // Expose the API functions globally for use by other profile modules
    window.profileApi = {
        fetchViewer,
        fetchUserById,
        fetchBusinessesByIds,
        fetchCategories,
        fetchReviewsByUser
    };
}());