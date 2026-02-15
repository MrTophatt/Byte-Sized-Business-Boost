(function registerBusinessDetailApi() {
    /**
     * Fetches the current business record.
     * Used for header stats and page-wide data.
     */
    async function fetchBusiness() {
        const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
        if (!businessResponse.ok) {
            throw new Error("Failed to fetch business");
        }
        return businessResponse.json();
    }

    /**
     * Fetches all reviews associated with the business.
     */
    async function fetchReviews() {
        const reviewsResponse = await fetch(`/api/reviews/${BUSINESS_ID}`);
        return reviewsResponse.ok ? reviewsResponse.json() : [];
    }

    // Expose API functions globally for other modules
    window.businessDetailApi = {
        fetchBusiness,
        fetchReviews
    };
}());