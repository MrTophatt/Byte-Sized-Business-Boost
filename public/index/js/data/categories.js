// Key used to store and retrieve category filter state from localStorage
// This ensures consistency across page reloads or sessions
const CATEGORY_STORAGE_KEY = "categoryFilters";

// Using a Set guarantees uniqueness and provides O(1) lookups
let includedCategories = new Set(); // Set of category identifiers that are explicitly INCLUDED by the user
let excludedCategories = new Set(); // Set of category identifiers that are explicitly EXCLUDED by the user

// Immediately load any previously-saved category filter state
// This initializes includedCategories and excludedCategories before UI rendering
loadCategoryState();

/**
 * Fetches available categories from the backend,
 * builds the category filter UI,
 * restores visual state based on saved filters,
 * and wires up interaction logic.
 */
async function loadCategories() {
    // Perform HTTP GET request to retrieve category data from the server
    const res = await fetch("/api/categories");

    // Parse the JSON response into a JavaScript array
    // Expected format: [{ value: string, icon: string }, ...]
    const categories = await res.json();

    // Select the container element that will hold the category rows
    const body = document.querySelector("#categoryDropdown .accordion-body");

    // Clear any previously-rendered categories to avoid duplicates
    body.innerHTML = "";

    // Iterate over each category returned by the API
    categories.forEach(({ value, icon }) => {
        // Create a wrapper div for a single category row
        const row = document.createElement("div");
        row.className = "category-row";

        // Create the main button used to INCLUDE / TOGGLE the category
        const includeBtn = document.createElement("button");
        includeBtn.type = "button"; // Prevents form submission side effects
        includeBtn.className = "category-btn include";

        // Store the category identifier on the button for reference
        includeBtn.dataset.value = value;

        // Populate the button with:
        // - Category icon
        // - Capitalized category label
        // - A visual indicator used when excluded
        includeBtn.innerHTML = `
            <i class="bi ${icon} me-2"></i>
                <span class="label">
                    ${value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
            <i class="bi bi-slash-circle deny-icon ms-2"></i>
        `;

        // Create a secondary button used specifically to EXCLUDE the category
        const excludeBtn = document.createElement("button");
        excludeBtn.type = "button";
        excludeBtn.className = "category-btn exclude";

        // Icon-only button indicating exclusion
        excludeBtn.innerHTML = `<i class="bi bi-slash-circle"></i>`;
        excludeBtn.title = "Exclude category";

        // -----------------------
        // RESTORE STATE
        // -----------------------
        // Apply visual state based on previously saved filter selections

        if (excludedCategories.has(value)) {
            // If category was previously excluded:
            // - Mark the entire row as excluded
            // - Style the include button as excluded (disabled-like state)
            row.classList.add("excluded");
            includeBtn.classList.add("excluded");

        } else if (includedCategories.has(value)) {
            // If category was previously included:
            // - Mark the include button as active
            includeBtn.classList.add("active");
        }

        // -----------------------
        // INCLUDE CLICK
        // -----------------------
        // Handles clicks on the include button
        includeBtn.addEventListener("click", () => {

            if (excludedCategories.has(value)) {
                // CASE: Category is currently excluded
                // Action: Move it back to neutral (neither included nor excluded)

                excludedCategories.delete(value);
                row.classList.remove("excluded");
                includeBtn.classList.remove("excluded");

            } else {
                // CASE: Category is not excluded
                // Action: Toggle inclusion state

                if (includedCategories.has(value)) {
                    // If already included, remove it
                    includedCategories.delete(value);
                    includeBtn.classList.remove("active");
                } else {
                    // If not included, add it
                    includedCategories.add(value);
                    includeBtn.classList.add("active");
                }
            }

            // Persist updated filter state to localStorage
            saveCategoryState();

            // Reset pagination to the first page
            currentPage = 1;

            // Reload business data using updated filters
            loadBusinesses();
        });

        // -----------------------
        // EXCLUDE CLICK
        // -----------------------
        // Handles clicks on the exclude button
        excludeBtn.addEventListener("click", (e) => {
            // Prevent the click from triggering the include button's handler
            e.stopPropagation();

            // Ensure category is not included
            includedCategories.delete(value);

            // Explicitly mark category as excluded
            excludedCategories.add(value);

            // Update visual state to reflect exclusion
            includeBtn.classList.remove("active");
            includeBtn.classList.add("excluded");
            row.classList.add("excluded");

            // Persist updated filter state
            saveCategoryState();

            // Reset pagination to the first page
            currentPage = 1;

            // Reload business data using updated filters
            loadBusinesses();
        });

        // Append buttons into the row container
        row.appendChild(includeBtn);
        row.appendChild(excludeBtn);

        // Add the completed row to the dropdown UI
        body.appendChild(row);
    });
}

/**
 * Clears all category filters (included and excluded),
 * updates persisted state,
 * re-renders the category UI,
 * and reloads business data.
 */
function clearCategoryFilters() {
    includedCategories.clear();
    excludedCategories.clear();

    saveCategoryState();
    loadCategories();
    loadBusinesses();
}

/**
 * Saves the current category filter state to localStorage.
 * Sets are converted to arrays to allow JSON serialization.
 */
function saveCategoryState() {
    localStorage.setItem(
        CATEGORY_STORAGE_KEY,
        JSON.stringify({
            included: [...includedCategories],
            excluded: [...excludedCategories]
        })
    );
}

/**
 * Loads category filter state from localStorage.
 * If parsing fails, resets state to prevent corrupted data issues.
 */
function loadCategoryState() {
    const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);

    // If no saved data exists, do nothing
    if (!saved) return;

    try {
        // Attempt to parse stored JSON
        const parsed = JSON.parse(saved);

        // Restore Sets from stored arrays (or empty arrays if missing)
        includedCategories = new Set(parsed.included || []);
        excludedCategories = new Set(parsed.excluded || []);

    } catch (err) {
        // If parsing fails, reset everything to a safe default
        console.warn("Invalid category filter state, resetting.");

        includedCategories = new Set();
        excludedCategories = new Set();

        // Remove corrupted data from localStorage
        localStorage.removeItem(CATEGORY_STORAGE_KEY);
    }
}