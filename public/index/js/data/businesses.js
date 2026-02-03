const container = document.getElementById("businessList");
const searchInput = document.getElementById("searchInput");
let searchTimeout = null;

searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        loadBusinesses();
        loadCategories();
    }, 50); // debounce delay
});

async function loadBusinesses() {
    const res = await fetch("/api/businesses");
    if (!res.ok) {
        console.error("Failed to load businesses");
        container.innerHTML = "";
        renderPagination();
        return;
    }
    let businesses = await res.json();

    const search = searchInput?.value?.toLowerCase() ?? "";

    // SEARCH
    businesses = businesses.filter(business =>
        business.name.toLowerCase().includes(search) ||
        business.description.toLowerCase().includes(search)
    );

    // SORT
    if (sortBy === "Rating") {
        businesses.sort((a, b) => b.avgRating - a.avgRating );
    }
    if (sortBy === "Reviews") {
        businesses.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    if (sortBy === "Favourites") {
        businesses.sort((a, b) => b.favouritesCount - a.favouritesCount);
    }
    
    // Filter businesses
    businesses = businesses.filter(business => {
        const cats = business.categories;

        // Excluded always wins
        for (const c of cats) {
            if (excludedCategories.has(c)) return false;
        }

        // If includes exist, at least one must match
        if (includedCategories.size > 0) {
            return cats.some(c => includedCategories.has(c));
        }

        return true;
    });

    // PAGINATION CALC
    totalPages = Math.ceil(businesses.length / perPage);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    businesses = businesses.slice(start, end);

    let favourites = [];
    if (userToken) {
        const favRes = await fetch("/api/users/favourites", {
            headers: { "x-user-token": userToken }
        });
        if (favRes.ok) {
            favourites = (await favRes.json()).favourites;
        }
    }

        container.innerHTML = "";
    businesses.forEach(business => {
        const isFavourited = favourites.includes(business._id);
        const favouritesCount = business.favouritesCount ?? 0;

        const div = document.createElement("div");
        div.innerHTML = `
            <div class="card h-100 position-relative bg-dark text-light">
                <a href="/business/${business._id}" class="text-decoration-none text-light">
                    <img src="${business.imageUrl}" class="card-img-top">
                    <div class="favourite-icon" style="display: ${isFavourited ? "block" : "none"};">
                        <svg viewBox="0 0 24 24" fill="#d6336c">
                            <path d="M12 21s-7.5-4.7-10-9c-2-3.4.5-8 5-8 2.5 0 4 2 5 3.5C13 6 14.5 4 17 4c4.5 0 7 4.6 5 8-2.5 4.3-10 9-10 9z"/>
                        </svg>
                    </div>
                    <div class="card-body">
                        <h5>${business.name}</h5>
                        <p class="small">${business.description}</p>
                        <div class="mb-2">
                            ${business.categories.map(c =>
                                `<span class="badge bg-primary me-1">${c}</span>`
                            ).join("")}
                        </div>
                        <small>⭐ ${business.avgRating} (${business.reviewCount}) | ❤ ${favouritesCount}</small>
                    </div>
                </a>
            </div>
        `;
        container.appendChild(div);
    });

    renderPagination();
}