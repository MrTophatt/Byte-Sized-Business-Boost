// -----------------------
// FILTER STATE
// -----------------------
let sortBy = "relevance"; // Current sort mode used when loading businesses
let perPage = 12; // Number of businesses shown per page

// Restore previously saved filter state from sessionStorage
const SAVED_SORT = sessionStorage.getItem("filter_sortBy");
const SAVED_PER_PAGE = sessionStorage.getItem("filter_perPage");

// Apply restored values if they exist
if (SAVED_SORT) sortBy = SAVED_SORT;
if (SAVED_PER_PAGE) perPage = Number(SAVED_PER_PAGE);

// Centralized storage keys for consistency
const STORAGE_KEYS = {
    sortBy: "filter_sortBy",
    perPage: "filter_perPage"
};

/**
 * Synchronizes the top filter UI with the current filter state.
 *
 * Updates:
 * - Selected sort option
 * - Sort dropdown button text
 * - Selected per-page option
 * - Per-page dropdown button text
 */
function syncTopFiltersUI() {
    // -----------------------
    // SORT DROPDOWN UI
    // -----------------------
    document.querySelectorAll("#sortDropdown .dropdown-item").forEach(btn => {
        // Determine if this option matches the active sort mode
        const isActive =
            btn.dataset.value.toUpperCase() === sortBy.toUpperCase();

        // Toggle selected state
        btn.classList.toggle("selected", isActive);

        // Update visible dropdown button text
        if (isActive) {
            document.getElementById("sortButtonText").textContent =
                sortBy.charAt(0).toUpperCase() + sortBy.slice(1);
        }
    });

    // -----------------------
    // PER-PAGE DROPDOWN UI
    // -----------------------
    document.querySelectorAll("#perPageDropdown .dropdown-item").forEach(btn => {
        // Determine if this option matches the active per-page value
        const isActive = Number(btn.dataset.value) === perPage;

        // Toggle selected state
        btn.classList.toggle("selected", isActive);

        // Update visible dropdown button text
        if (isActive) {
            document.getElementById("perPageButtonText").textContent =
                btn.dataset.value;
        }
    });
}

/**
 * Sets up dropdown selection behavior for a Bootstrap accordion dropdown.
 *
 * This function:
 * - Restores the selected option based on the current value
 * - Updates the dropdown button text
 * - Handles click behavior and visual state
 *
 * @param {string} dropdownId ID of the dropdown container
 * @param {string} buttonTextId ID of the element displaying the selected value
 * @param {string|number} currentValue Current active value
 */
function setupAccordionSelection(dropdownId, buttonTextId, currentValue) {
    const dropdown = document.getElementById(dropdownId);
    const buttonText = document.getElementById(buttonTextId);

    // Iterate over each selectable option
    dropdown.querySelectorAll(".dropdown-item").forEach(btn => {
        // Restore selected state if this option matches the current value
        if (btn.dataset.value === String(currentValue)) {
            btn.classList.add("selected");

            // Format displayed text depending on dropdown type
            if (dropdownId === "sortDropdown") {
                buttonText.textContent =
                    btn.dataset.value.charAt(0).toUpperCase() +
                    btn.dataset.value.slice(1);
            } else {
                buttonText.textContent = btn.dataset.value;
            }
        }

        // Handle option click
        btn.addEventListener("click", () => {
            // Clear selected state from all options
            dropdown
                .querySelectorAll(".dropdown-item")
                .forEach(i => i.classList.remove("selected"));

            // Mark this option as selected
            btn.classList.add("selected");

            // Close the Bootstrap accordion dropdown
            bootstrap.Collapse.getInstance(dropdown).hide();
        });
    });
}

// Initialize dropdown selection state
setupAccordionSelection("sortDropdown", "sortButtonText");
setupAccordionSelection("perPageDropdown", "perPageButtonText");

// -----------------------
// SORT SELECTION HANDLING
// -----------------------
document.querySelectorAll('#sortDropdown .dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update sort state
        sortBy = btn.dataset.value;

        // Persist selection for the current session
        sessionStorage.setItem(STORAGE_KEYS.sortBy, sortBy);

        // Close the dropdown
        bootstrap.Collapse
            .getInstance(document.getElementById('sortDropdown'))
            .hide();

        // Sync UI and reload businesses
        syncTopFiltersUI();
        currentPage = 1;
        loadBusinesses();
    });
});

// -----------------------
// PER-PAGE SELECTION HANDLING
// -----------------------
document.querySelectorAll('#perPageDropdown .dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
        // Update per-page state
        perPage = Number(btn.dataset.value);

        // Persist selection for the current session
        sessionStorage.setItem(STORAGE_KEYS.perPage, perPage);

        // Close the dropdown
        bootstrap.Collapse
            .getInstance(document.getElementById('perPageDropdown'))
            .hide();

        // Sync UI and reload businesses
        syncTopFiltersUI();
        currentPage = 1;
        loadBusinesses();
    });
});

// Ensure UI is synced once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    syncTopFiltersUI();
});