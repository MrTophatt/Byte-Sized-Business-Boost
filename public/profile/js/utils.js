(function registerProfileUtils() {
    const { PROFILE_PATH_SEGMENT } = window.profileConstants;

    function hashString(input) {
        let hash = 0;
        for (let index = 0; index < input.length; index += 1) {
            hash = input.charCodeAt(index) + ((hash << 5) - hash);
        }
        return hash;
    }

    function getHueFromToken(token) {
        return Math.abs(hashString(token)) % 360;
    }

    function getViewedUserIdFromPath() {
        const [, profileSegment, userId] = window.location.pathname.split("/");
        if (profileSegment !== PROFILE_PATH_SEGMENT) return null;
        return userId || null;
    }

    function getFirstName(nameText = "") {
        return String(nameText).trim().split(" ")[0] || "User";
    }

    window.profileUtils = {
        hashString,
        getHueFromToken,
        getViewedUserIdFromPath,
        getFirstName
    };
}());