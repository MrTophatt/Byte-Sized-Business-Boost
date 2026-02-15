(function registerBusinessDetailApi() {
    /**
     * Fetches business-level favourite counts and updates the header metric.
     * @returns {Promise<Object>} Full business response body.
     */
    async function fetchBusiness() {
        const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
        if (!businessResponse.ok) throw new Error("Failed to fetch business");
        return businessResponse.json();
    }

    /**
     * Fetches review data for the active business page.
     * @returns {Promise<Array>} Reviews list from API.
     */
    async function fetchReviews() {
        const reviewsResponse = await fetch(`/api/reviews/${BUSINESS_ID}`);
        return reviewsResponse.ok ? reviewsResponse.json() : [];
    }

    window.businessDetailApi = {
        fetchBusiness,
        fetchReviews
    };
}());