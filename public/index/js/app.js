/**
 * Rehydrates page state when the user returns to this page
 * via browser history (back/forward navigation).
 *
 * This event fires even if the page was previously cached by the browser,
 * so it ensures the UI reflects the latest client-side state.
 */
window.addEventListener("pageshow", () => {
    updateFavourites(); // Refresh favourite indicators for businesses
    loadCategoryState(); // Restore category filter state from localStorage
    loadCategories(); // Re-render category filter UI
    loadBusinesses(); // Reload and render businesses using restored filters
});

/**
 * Performs the initial page bootstrap once the DOM tree is fully parsed.
 *
 * This ensures that all DOM elements exist before scripts attempt
 * to read from or write to them.
 */
window.addEventListener("DOMContentLoaded", () => {
    updateFavourites(); // Load favourite state for the logged-in user
    loadCategoryState(); // Restore saved category filter state
    loadCategories(); // Render category filter UI
    loadBusinesses(); // Load and render business listings
});
