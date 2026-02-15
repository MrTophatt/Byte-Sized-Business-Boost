// -----------------------
// PAGINATION STATE
// -----------------------
let currentPage = 1; // Currently active page
let totalPages = 1; // Total number of pages available
const PAGINATION = document.getElementById("pagination"); // Pagination container element

/**
 * Renders pagination controls based on the current page and total pages.
 *
 * Handles:
 * - Page buttons
 * - Ellipsis for skipped page ranges
 * - Visibility toggling when pagination is unnecessary
 */
function renderPagination() {
    // Clear any existing pagination buttons
    PAGINATION.innerHTML = "";

    // Hide pagination entirely if only one page exists
    if (totalPages <= 1) {
        PAGINATION.innerHTML = "";
        PAGINATION.parentElement.style.display = "none";
        return;
    }

    // Ensure pagination container is visible
    PAGINATION.parentElement.style.display = "flex";
    PAGINATION.innerHTML = "";

    /**
     * Creates and appends a pagination button.
     *
     * @param {string} label Text displayed on the button
     * @param {number} page Page number the button navigates to
     * @param {boolean} isActive Whether the button represents the current page
     */
    function addButton(label, page, isActive = false) {
        const btn = document.createElement("button");
        btn.textContent = label;

        // Highlight the active page button
        if (isActive) btn.classList.add("active");

        // Navigate to the selected page on click
        btn.onclick = () => {
            currentPage = page;
            loadBusinesses();
            loadCategories();
        };

        PAGINATION.appendChild(btn);
    }

    /**
     * Adds a non-interactive ellipsis element
     * to indicate skipped page ranges.
     */
    function addEllipsis() {
        const span = document.createElement("span");
        span.textContent = "…";
        span.className = "ellipsis";
        PAGINATION.appendChild(span);
    }

    // -----------------------
    // PAGINATION STRUCTURE
    // -----------------------

    // Always show the first page
    addButton("1", 1, currentPage === 1);

    // Show left ellipsis if there is a gap after the first page
    if (currentPage > 3) addEllipsis();

    // Show previous page button if applicable
    if (currentPage > 2) {
        addButton(currentPage - 1, currentPage - 1);
    }

    // Show current page button if it is not first or last
    if (currentPage !== 1 && currentPage !== totalPages) {
        addButton(currentPage, currentPage, true);
    }

    // Show next page button if applicable
    if (currentPage < totalPages - 1) {
        addButton(currentPage + 1, currentPage + 1);
    }

    // Show right ellipsis if there is a gap before the last page
    if (currentPage < totalPages - 2) addEllipsis();

    // Always show the last page if more than one page exists
    if (totalPages > 1) {
        addButton(
            totalPages.toString(),
            totalPages,
            currentPage === totalPages
        );
    }
}