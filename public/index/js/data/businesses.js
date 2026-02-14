const container = document.getElementById("businessList");
const searchInput = document.getElementById("searchInput");
const ratingMinInput = document.getElementById("ratingMinInput");
const ratingMaxInput = document.getElementById("ratingMaxInput");
const ratingMinValue = document.getElementById("ratingMinValue");
const ratingMaxValue = document.getElementById("ratingMaxValue");
const clearRatingFilterBtn = document.getElementById("clearRatingFilterBtn");
const RATING_FILTER_STORAGE_KEY = "ratingRangeFilter";
const DEFAULT_MIN_RATING = 0;
const DEFAULT_MAX_RATING = 5;
let searchTimeout = null;

let minRating = DEFAULT_MIN_RATING;
let maxRating = DEFAULT_MAX_RATING;

function clampRating(value) {
    return Math.min(DEFAULT_MAX_RATING, Math.max(DEFAULT_MIN_RATING, value));
}

function parseRatingInput(value, fallbackValue) {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return fallbackValue;

    return clampRating(parsed);
}

function saveRatingFilterState() {
    localStorage.setItem(
        RATING_FILTER_STORAGE_KEY,
        JSON.stringify({ minRating, maxRating })
    );
}

function syncRatingFilterUI() {
    if (ratingMinInput) ratingMinInput.value = String(minRating);
    if (ratingMaxInput) ratingMaxInput.value = String(maxRating);

    if (ratingMinValue) ratingMinValue.textContent = minRating.toFixed(1);
    if (ratingMaxValue) ratingMaxValue.textContent = maxRating.toFixed(1);
}

function loadRatingFilterState() {
    const saved = localStorage.getItem(RATING_FILTER_STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);
        minRating = parseRatingInput(parsed.minRating, DEFAULT_MIN_RATING);
        maxRating = parseRatingInput(parsed.maxRating, DEFAULT_MAX_RATING);

        if (minRating > maxRating) {
            minRating = DEFAULT_MIN_RATING;
            maxRating = DEFAULT_MAX_RATING;
        }
    } catch (error) {
        minRating = DEFAULT_MIN_RATING;
        maxRating = DEFAULT_MAX_RATING;
        localStorage.removeItem(RATING_FILTER_STORAGE_KEY);
    }
}

function applyRatingFilterFromInputs(changedBy) {
    const nextMin = parseRatingInput(ratingMinInput?.value, minRating);
    const nextMax = parseRatingInput(ratingMaxInput?.value, maxRating);

    minRating = nextMin;
    maxRating = nextMax;

    if (minRating > maxRating) {
        if (changedBy === "min") {
            maxRating = minRating;
        } else {
            minRating = maxRating;
        }
    }

    syncRatingFilterUI();
    saveRatingFilterState();

    currentPage = 1;
    loadBusinesses();
}

loadRatingFilterState();
syncRatingFilterUI();

ratingMinInput?.addEventListener("input", () => applyRatingFilterFromInputs("min"));
ratingMaxInput?.addEventListener("input", () => applyRatingFilterFromInputs("max"));

clearRatingFilterBtn?.addEventListener("click", () => {
    minRating = DEFAULT_MIN_RATING;
    maxRating = DEFAULT_MAX_RATING;
    syncRatingFilterUI();
    saveRatingFilterState();

    currentPage = 1;
    loadBusinesses();
});

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
        (business.shortDescription || business.description || "").toLowerCase().includes(search) ||
        (business.longDescription || "").toLowerCase().includes(search)
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

    // Rating range filter
    businesses = businesses.filter((business) => {
        const rating = Number(business.avgRating);
        if (Number.isNaN(rating)) return false;

        if (rating < minRating) return false;
        if (rating > maxRating) return false;

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
                        <p class="small">${business.shortDescription || business.description || ""}</p>
                        <div class="mb-2">
                            ${business.categories.map(c =>
                                `<span class="badge bg-primary me-1">${c}</span>`
                            ).join("")}
                        </div>
                        <small>
                            <i class="bi bi-star-fill text-warning"></i> ${business.avgRating} (${business.reviewCount}) |
                            <i class="bi bi-heart-fill text-danger"></i> ${favouritesCount}
                        </small>
                    </div>
                </a>
            </div>
        `;
        container.appendChild(div);
    });

    renderPagination();
}