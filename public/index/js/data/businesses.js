// -----------------------
// DOM REFERENCES & STATE
// -----------------------
const CONTAINER = document.getElementById("businessList"); // Container element where business cards will be rendered
const SEARCH_INPUT = document.getElementById("searchInput"); // Search input field used to filter businesses by text
let searchTimeout; // Timeout reference used to debounce search input changes
let categoryIconByValue = new Map(); // Cache of category value -> icon class for rendering tag icons

function formatCategoryLabel(value = "") {
    return String(value)
        .replace(/[\-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getCategoryIconMap() {
    if (categoryIconByValue.size) {
        return categoryIconByValue;
    }

    try {
        const response = await fetch("/api/categories");

        if (!response.ok) {
            throw new Error("Unable to load categories");
        }

        const categories = await response.json();
        categoryIconByValue = new Map(
            (Array.isArray(categories) ? categories : [])
                .map((category) => [category.value, category.icon])
        );
    } catch (error) {
        console.error(error);
        categoryIconByValue = new Map();
    }

    return categoryIconByValue;
}

// -----------------------
// SEARCH INPUT HANDLING
// -----------------------
// Adds a debounced input listener to the search field
// Debouncing prevents rapid re-fetching and re-rendering while the user is typing
SEARCH_INPUT?.addEventListener("input", () => {
    // Cancel any pending search execution
    clearTimeout(searchTimeout);

    // Schedule a new search execution after a short delay
    searchTimeout = setTimeout(() => {
        // Reload businesses using the updated search term
        loadBusinesses();

        // Reload categories so category UI stays in sync with filtered results
        loadCategories();
    }, 50); // Small debounce delay to prevent double rendering and filter desync
});

/**
 * Fetches, filters, sorts, paginates, and renders businesses.
 *
 * This function:
 * - Fetches all businesses from the API
 * - Applies search, category, and rating filters
 * - Applies sorting and pagination
 * - Fetches user favourites (if logged in)
 * - Renders business cards into the DOM
 */
async function loadBusinesses() {
    // -----------------------
    // FETCH BUSINESSES
    // -----------------------
    let res = await fetch("/api/businesses"); // Fetch all businesses from the backend

    // If the API request fails, clear the UI and stop execution
    if (!res.ok) {
        console.error("Failed to load businesses");
        CONTAINER.innerHTML = "";
        renderPagination();
        return;
    }

    // Parse the response JSON into an array of business objects
    let businesses = await res.json();
    const categoryIcons = await getCategoryIconMap();

    // -----------------------
    // SEARCH FILTER
    // -----------------------
    let search = SEARCH_INPUT?.value?.toLowerCase() ?? ""; // Read the current search input and normalize it for comparison

    // Filter businesses based on text search
    businesses = businesses.filter(business =>
        // Match against business name
        business.name.toLowerCase().includes(search) ||

        // Match against short or fallback description
        (business.shortDescription || business.description || "")
            .toLowerCase()
            .includes(search) ||

        // Match against long description
        (business.longDescription || "")
            .toLowerCase()
            .includes(search)
    );

    // -----------------------
    // SORTING
    // -----------------------
    if (sortBy === "Rating") { // Sort by average rating (highest first)
        businesses.sort((a, b) => b.avgRating - a.avgRating);
    }

    if (sortBy === "Reviews") { // Sort by number of reviews (highest first)
        businesses.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    if (sortBy === "Favourites") { // Sort by number of favourites (highest first)
        businesses.sort((a, b) => b.favouritesCount - a.favouritesCount);
    }

    // -----------------------
    // CATEGORY FILTERING
    // -----------------------
    businesses = businesses.filter(business => {
        let categories = business.categories;

        // EXCLUDED categories take priority:
        // If the business contains ANY excluded category, it is removed
        for (let category of categories) {
            if (excludedCategories.has(category)) return false;
        }

        // If included categories exist:
        // The business must match AT LEAST ONE included category
        if (includedCategories.size > 0) {
            return categories.some(category =>
                includedCategories.has(category)
            );
        }

        // If no include filters exist, allow the business
        return true;
    });

    // -----------------------
    // RATING RANGE FILTER
    // -----------------------
    businesses = businesses.filter(business => {
        // Convert rating to a number
        let rating = Number(business.avgRating);

        // Discard businesses with invalid or missing ratings
        if (Number.isNaN(rating)) return false;

        // Enforce minimum rating filter
        if (rating < minRating) return false;

        // Enforce maximum rating filter
        if (rating > maxRating) return false;

        return true;
    });

    // -----------------------
    // PAGINATION
    // -----------------------
    totalPages = Math.ceil(businesses.length / perPage); // Calculate total number of pages based on filtered results

    if (currentPage > totalPages) currentPage = 1; // Clamp current page to valid bounds

    // Determine slice range for the current page
    let start = (currentPage - 1) * perPage;
    let end = start + perPage;
    businesses = businesses.slice(start, end); // Extract only the businesses for the current page

    // -----------------------
    // FETCH USER FAVOURITES
    // -----------------------
    let favourites = [];

    // Only fetch favourites if the user is logged in
    if (USER_TOKEN) {
        let favRes = await fetch("/api/users/favourites", {
            headers: { "x-user-token": USER_TOKEN }
        });

        // If successful, store the list of favourited business IDs
        if (favRes.ok) {
            favourites = (await favRes.json()).favourites;
        }
    }

    // -----------------------
    // RENDER BUSINESS CARDS
    // ----------------------- 
    CONTAINER.innerHTML = ""; // Clear existing business cards

    businesses.forEach(business => {
        // Determine if this business is favourited by the user
        let isFavourited = favourites.includes(business._id);

        // Safely normalize numeric values
        let favouritesCount = business.favouritesCount ?? 0;
        let reviewCount = business.reviewCount ?? 0;
        let avgRating = business.avgRating ?? 0;

        // Create a wrapper element for the business card
        let div = document.createElement("div");
        div.className = "business-card-wrap";

        // Populate business card HTML
        div.innerHTML = `
            <article class="business-card h-100 position-relative">
                <a href="/business/${business._id}" class="business-card-link text-decoration-none text-light">
                    <img src="${business.bannerImageUrl || business.imageUrl}"
                         class="business-card-banner"
                         alt="${business.name} banner">

                    <div class="business-card-content">
                        <div class="business-card-top">
                            <img src="${business.logoImageUrl || business.imageUrl}"
                                 class="business-card-logo"
                                 alt="${business.name} logo">

                            <div class="business-card-heading">
                                <h5 class="business-card-title">${business.name}</h5>
                                <p class="business-card-owner">
                                    by ${business.ownerName || "Local owner"}
                                </p>
                            </div>
                        </div>

                        <p class="business-card-description">
                            ${business.shortDescription || business.description || ""}
                        </p>

                        <div class="business-card-tags">
                            ${business.categories
                                .map((category) => {
                                    const iconClass = categoryIcons.get(category);
                                    const iconMarkup = iconClass
                                        ? `<i class="bi ${iconClass} business-pill-icon" aria-hidden="true"></i>`
                                        : "";

                                    return `<span class="business-pill">${iconMarkup}${formatCategoryLabel(category)}</span>`;
                                })
                                .join("")}
                        </div>

                        <div class="business-card-stats">
                            <span>
                                <i class="bi bi-star-fill text-warning"></i>
                                ${avgRating}
                                <span class="muted">(${reviewCount})</span>
                            </span>

                            <span>
                                <i class="bi bi-heart-fill text-danger"></i>
                                ${formatCompactCount(favouritesCount)}
                            </span>
                        </div>
                    </div>
                </a>

                <!-- Visual indicator shown only if the business is favourited -->
                <div class="favourite-icon"
                     style="display: ${isFavourited ? "block" : "none"};">
                    <svg viewBox="0 0 24 24" fill="#d6336c">
                        <path d="M12 21s-7.5-4.7-10-9c-2-3.4.5-8 5-8
                                 2.5 0 4 2 5 3.5
                                 C13 6 14.5 4 17 4
                                 c4.5 0 7 4.6 5 8
                                 -2.5 4.3-10 9-10 9z"/>
                    </svg>
                </div>
            </article>
        `;

        // Append the completed card to the container
        CONTAINER.appendChild(div);
    });

    // -----------------------
    // PAGINATION UI UPDATE
    // -----------------------
    renderPagination(); // Re-render pagination controls after business list updates
}