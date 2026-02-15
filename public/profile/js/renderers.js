(function registerProfileRenderers() {

    // Constants used across profile rendering
    const { DEFAULT_AVATAR_URL, GUEST_ROLE } = window.profileConstants;

    // Utility helpers used for formatting
    const { getHueFromToken, getFirstName } = window.profileUtils;

    /**
     * Renders a simple empty-state message inside a container.
     */
    function renderEmptyState(container, text) {
        container.innerHTML = `<div class="profile-empty-state">${text}</div>`;
    }

    /**
     * Creates a styled label element used for section headings.
     */
    function createSectionLabel(text) {
        const sectionLabelElement = document.createElement("span");
        sectionLabelElement.className = "profile-section-label";
        sectionLabelElement.textContent = text;
        return sectionLabelElement;
    }

    /**
     * Renders the profile header section including:
     * - Avatars
     * - Name and email
     * - Role badges
     * - Page title
     * - Section headings
     */
    function renderProfileHeader(viewer, viewedUser, userToken) {

        // Determine if the viewer is looking at their own profile
        const isOwnProfile = String(viewer._id) === String(viewedUser._id);

        // Cache DOM elements used by the header
        const avatarElement = document.getElementById("avatar");
        const profileAvatarElement = document.getElementById("profileAvatar");
        const roleBadgeElement = document.getElementById("roleBadge");
        const profileNameElement = document.getElementById("profileName");
        const profileEmailElement = document.getElementById("profileEmail");
        const profileContextElement = document.getElementById("profileContext");
        const favouritesHeadingElement = document.getElementById("favouritesHeading");
        const reviewsHeadingElement = document.getElementById("reviewsHeading");

        // Set viewer avatar
        avatarElement.src = viewer.avatarUrl || DEFAULT_AVATAR_URL;
        avatarElement.alt = viewer.name || "User avatar";

        // Set profile avatar
        profileAvatarElement.src = viewedUser.avatarUrl || DEFAULT_AVATAR_URL;
        profileAvatarElement.alt = viewedUser.name || "User avatar";

        // Populate name and email fields
        profileNameElement.textContent = viewedUser.name || "Guest";
        profileEmailElement.textContent =
            viewedUser.email || (isOwnProfile ? "" : "Email hidden");

        // Apply special styling for guest users
        if (viewer.role === GUEST_ROLE) {
            avatarElement.style.filter =
                `hue-rotate(${getHueFromToken(userToken)}deg) saturate(20)`;
            roleBadgeElement.style.display = "inline-block";
        } else {
            avatarElement.style.filter = "";
            roleBadgeElement.style.display = "none";
        }

        // Apply color-derived styling for viewed guest users
        if (viewedUser.role === GUEST_ROLE) {
            profileAvatarElement.style.filter =
                `hue-rotate(${getHueFromToken(String(viewedUser._id))}deg) saturate(20)`;
        } else {
            profileAvatarElement.style.filter = "";
        }

        // Update browser tab title
        document.title = `${profileNameElement.textContent} | Profile`;

        // Render profile context label
        profileContextElement.innerHTML = "";
        profileContextElement.appendChild(
            createSectionLabel(isOwnProfile ? "Your Profile" : "Community Profile")
        );

        const firstName = getFirstName(profileNameElement.textContent);

        // Update section headings based on ownership
        favouritesHeadingElement.textContent = isOwnProfile
            ? "Your Favourite Businesses"
            : `${firstName}'s Favourite Businesses`;

        reviewsHeadingElement.textContent = isOwnProfile
            ? "Your Reviews"
            : `${firstName}'s Reviews`;
    }
});