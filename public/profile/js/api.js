(function registerProfileApi() {
    const userToken = localStorage.getItem("userToken");

    async function fetchWithAuth(url) {
        const response = await fetch(url, {
            headers: { "x-user-token": userToken }
        });

        if (!response.ok) {
            throw new Error(`Request failed (${response.status}): ${url}`);
        }

        return response.json();
    }

    async function fetchViewer() {
        return fetchWithAuth("/api/users/me");
    }

    async function fetchUserById(userId) {
        return fetchWithAuth(`/api/users/${userId}`);
    }

    async function fetchBusinessesByIds(ids = []) {
        if (!Array.isArray(ids) || !ids.length) {
            return [];
        }

        const uniqueIds = [...new Set(ids.map((id) => String(id)).filter(Boolean))];
        const query = encodeURIComponent(uniqueIds.join(","));
        const response = await fetch(`/api/businesses?ids=${query}`);

        if (!response.ok) {
            throw new Error("Unable to load businesses");
        }

        return response.json();
    }

    async function fetchCategories() {
        const response = await fetch("/api/categories");

        if (!response.ok) {
            throw new Error("Unable to load categories");
        }

        return response.json();
    }

    async function fetchReviewsByUser(userId) {
        if (!userId) {
            return fetchWithAuth("/api/reviews/me");
        }

        return fetchWithAuth(`/api/reviews/user/${userId}`);
    }

    window.profileApi = {
        fetchViewer,
        fetchUserById,
        fetchBusinessesByIds,
        fetchCategories,
        fetchReviewsByUser
    };
}());