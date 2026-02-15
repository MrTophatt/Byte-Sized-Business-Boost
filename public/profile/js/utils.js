(function registerProfileUtils() {

    // Constant used to identify profile routes in the URL
    const { PROFILE_PATH_SEGMENT } = window.profileConstants;

    /**
     * Generates a numeric hash from a string.
     * Used for deterministic color generation.
     */
    function hashString(input) {
        let hash = 0;

        for (let index = 0; index < input.length; index += 1) {
            hash = input.charCodeAt(index) + ((hash << 5) - hash);
        }

        return hash;
    }

    /**
     * Converts a token into a hue value (0–359).
     */
    function getHueFromToken(token) {
        return Math.abs(hashString(token)) % 360;
    }

    /**
     * Extracts a user ID from the current URL if it matches the profile route.
     */
    function getViewedUserIdFromPath() {
        const [, profileSegment, userId] = window.location.pathname.split("/");

        if (profileSegment !== PROFILE_PATH_SEGMENT) return null;

        return userId || null;
    }

    /**
     * Extracts the first name from a full name string.
     */
    function getFirstName(nameText = "") {
        return String(nameText).trim().split(" ")[0] || "User";
    }

    // Expose utility helpers globally
    window.profileUtils = {
        hashString,
        getHueFromToken,
        getViewedUserIdFromPath,
        getFirstName
    };
}());