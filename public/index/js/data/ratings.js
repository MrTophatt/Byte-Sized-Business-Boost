// -----------------------
// DOM ELEMENT REFERENCES
// -----------------------
const RATING_MIN_INPUT = document.getElementById("ratingMinInput"); // Slider/input element for the minimum rating filter
const RATING_MAX_INPUT = document.getElementById("ratingMaxInput"); // Slider/input element for the maximum rating filter
const RATING_MIN_VALUE = document.getElementById("ratingMinValue"); // Element that displays the current minimum rating value as text
const RATING_MAX_VALUE = document.getElementById("ratingMaxValue"); // Element that displays the current maximum rating value as text
const CLEAR_RATING_FILTER_BTN = document.getElementById("clearRatingFilterBtn"); // Button that clears the rating filter and resets it to defaults

const RATING_FILTER_STORAGE_KEY = "ratingRangeFilter"; // Key used to persist rating filter state in localStorage
const DEFAULT_MIN_RATING = 0; // Absolute lower bound allowed for ratings
const DEFAULT_MAX_RATING = 5; // Absolute upper bound allowed for ratings

// -----------------------
// CURRENT FILTER STATE
// -----------------------
let minRating = DEFAULT_MIN_RATING; // Currently-selected minimum rating filter
let maxRating = DEFAULT_MAX_RATING; // Currently-selected maximum rating filter

/**
 * Formats numeric values into a compact, user-readable string.
 * Intended for display purposes only.
 *
 * Examples:
 * 1000      -> "1.0k"
 * 1000000  -> "1.0M"
 *
 * @param {number} value The numeric value to format
 * @returns {string} A compact string representation of the number
 */
function formatCompactCount(value) {
    // Convert input to a number; fall back to 0 if conversion fails
    let number = Number(value) || 0;

    // Convert millions to "XM" format
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;

    // Convert thousands to "Xk" format
    if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;

    // Return smaller values as-is
    return String(number);
}

/**
 * Restricts a rating value so it never falls outside
 * the allowed rating range (0–5).
 *
 * @param {number} value The rating to clamp
 * @returns {number} The clamped rating value
 */
function clampRating(value) {
    // First ensure value is not below the minimum,
    // then ensure it does not exceed the maximum
    return Math.min(DEFAULT_MAX_RATING, Math.max(DEFAULT_MIN_RATING, value));
}

/**
 * Parses and validates a rating input value.
 *
 * - Converts input to a number
 * - Falls back to a default if parsing fails
 * - Ensures the value is within valid bounds
 *
 * @param {number} value The raw input value to parse
 * @param {number} fallbackValue Value to use if parsing fails
 * @returns {number} A valid, clamped rating value
 */
function parseRatingInput(value, fallbackValue) {
    // Convert the input to a number
    let parsed = Number(value);

    // If conversion fails, return the fallback
    if (Number.isNaN(parsed)) return fallbackValue;

    // Clamp the parsed value to allowed rating range
    return clampRating(parsed);
}

/**
 * Persists the current rating filter state in localStorage.
 * This allows filters to be restored after a page reload.
 */
function saveRatingFilterState() {
    localStorage.setItem(
        RATING_FILTER_STORAGE_KEY,
        JSON.stringify({ minRating, maxRating })
    );
}

/**
 * Synchronizes the UI with the current rating filter state.
 *
 * - Updates slider/input values
 * - Updates displayed numeric labels
 *
 * This ensures the UI always reflects the actual internal state.
 */
function syncRatingFilterUI() {
    // Update input elements if they exist
    if (RATING_MIN_INPUT) RATING_MIN_INPUT.value = String(minRating);
    if (RATING_MAX_INPUT) RATING_MAX_INPUT.value = String(maxRating);

    // Update displayed values if they exist
    if (RATING_MIN_VALUE) RATING_MIN_VALUE.textContent = minRating.toFixed(1);
    if (RATING_MAX_VALUE) RATING_MAX_VALUE.textContent = maxRating.toFixed(1);
}

/**
 * Loads previously-saved rating filter state from localStorage.
 *
 * - Restores min and max ratings
 * - Validates and clamps restored values
 * - Resets to defaults if stored data is invalid or corrupted
 */
function loadRatingFilterState() {
    let saved = localStorage.getItem(RATING_FILTER_STORAGE_KEY);

    // If no saved filter exists, do nothing
    if (!saved) return;

    try {
        // Attempt to parse stored JSON
        let parsed = JSON.parse(saved);

        // Restore values, validating and clamping them
        minRating = parseRatingInput(parsed.minRating, DEFAULT_MIN_RATING);
        maxRating = parseRatingInput(parsed.maxRating, DEFAULT_MAX_RATING);

        // Ensure logical ordering (min must not exceed max)
        if (minRating > maxRating) {
            minRating = DEFAULT_MIN_RATING;
            maxRating = DEFAULT_MAX_RATING;
        }
    } catch (error) {
        // On parse failure, reset to safe defaults
        minRating = DEFAULT_MIN_RATING;
        maxRating = DEFAULT_MAX_RATING;

        // Remove corrupted data
        localStorage.removeItem(RATING_FILTER_STORAGE_KEY);
    }
}

/**
 * Applies rating filters based on current input values.
 *
 * - Reads slider/input values
 * - Validates and clamps them
 * - Ensures min does not exceed max
 * - Persists state and reloads business results
 *
 * @param {"min" | "max"} changedBy Indicates which input triggered the update
 */
function applyRatingFilterFromInputs(changedBy) {
    // Parse new values from the input elements
    let nextMin = parseRatingInput(RATING_MIN_INPUT?.value, minRating);
    let nextMax = parseRatingInput(RATING_MAX_INPUT?.value, maxRating);

    // Apply parsed values to state
    minRating = nextMin;
    maxRating = nextMax;

    // If the range becomes invalid, auto-correct based on which input changed
    if (minRating > maxRating) {
        if (changedBy === "min") {
            maxRating = minRating;
        } else {
            minRating = maxRating;
        }
    }

    // Update UI and persist changes
    syncRatingFilterUI();
    saveRatingFilterState();

    // Reset pagination and reload filtered results
    currentPage = 1;
    loadBusinesses();
}

// -----------------------
// INITIALIZATION
// -----------------------
loadRatingFilterState(); // Restore saved rating filters on page load
syncRatingFilterUI(); // Ensure UI reflects restored state

// -----------------------
// EVENT LISTENERS
// -----------------------

// React to changes in minimum rating input
RATING_MIN_INPUT?.addEventListener("input", () =>
    applyRatingFilterFromInputs("min")
);

// React to changes in maximum rating input
RATING_MAX_INPUT?.addEventListener("input", () =>
    applyRatingFilterFromInputs("max")
);

// Reset rating filters when clear button is clicked
CLEAR_RATING_FILTER_BTN?.addEventListener("click", () => {
    minRating = DEFAULT_MIN_RATING;
    maxRating = DEFAULT_MAX_RATING;

    syncRatingFilterUI();
    saveRatingFilterState();

    currentPage = 1;
    loadBusinesses();
});