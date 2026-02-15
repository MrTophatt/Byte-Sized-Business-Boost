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

    async function fetchBusinesses() {
        const response = await fetch("/api/businesses");
        if (!response.ok) {
            throw new Error("Unable to load businesses");
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
        fetchBusinesses,
        fetchReviewsByUser
    };
}());