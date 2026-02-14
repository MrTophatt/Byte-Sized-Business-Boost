const ratingElement = document.getElementById("rating");
const reviewCountElement = document.getElementById("review-count");
const favouriteCountElement = document.getElementById("favourite-count");
const REVIEW_STAR_BUCKETS = [5, 4, 3, 2, 1];
const DAY_KEYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
];

/**
 * Converts a lower-case weekday label into title case for UI display.
 * @param {string} day - Weekday value such as "monday".
 * @returns {string} Title-cased day label.
 */
function formatDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

/**
 * Formats a date value into a readable short date string for deal ranges.
 * @param {string|Date} dateValue - Raw date from API or Date object.
 * @returns {string} Formatted date string (e.g., "Jan 4, 2026").
 */
function formatDealDate(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

/**
 * Formats a timetable time string (24-hour) into a localized 12-hour string.
 * @param {string|null} timeValue - Raw time like "13:30".
 * @returns {string} 12-hour formatted time or "--" when unavailable.
 */
function formatTime12Hour(timeValue) {
    if (!timeValue || typeof timeValue !== "string") return "--";

    const [hoursRaw, minutesRaw = "00"] = timeValue.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

/**
 * Finds today's timetable entry from a weekly timetable array.
 * @param {Array<{day: string, isClosed: boolean, opensAt: (string|null), closesAt: (string|null)}>} timetable - Weekly timetable.
 * @returns {{day: string, isClosed: boolean, opensAt: (string|null), closesAt: (string|null)}|null} Today's entry or null.
 */
function getTodaySchedule(timetable = []) {
    const todayKey = DAY_KEYS[new Date().getDay()];
    return timetable.find((entry) => entry.day === todayKey) || null;
}

function parseTimeToMinutes(timeValue) {
    if (!timeValue || typeof timeValue !== "string") return null;

    const [hoursRaw, minutesRaw = "0"] = timeValue.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return (hours * 60) + minutes;
}

function isCurrentlyOpen(schedule, now = new Date()) {
    if (!schedule || schedule.isClosed) return false;

    const opensAtMinutes = parseTimeToMinutes(schedule.opensAt);
    const closesAtMinutes = parseTimeToMinutes(schedule.closesAt);
    if (opensAtMinutes === null || closesAtMinutes === null) return false;

    const nowMinutes = (now.getHours() * 60) + now.getMinutes();

    if (opensAtMinutes === closesAtMinutes) return true;

    if (opensAtMinutes < closesAtMinutes) {
        return nowMinutes >= opensAtMinutes && nowMinutes < closesAtMinutes;
    }

    return nowMinutes >= opensAtMinutes || nowMinutes < closesAtMinutes;
}

/**
 * Renders business owner and open status text in the top header.
 * @param {Object} business - Business object from API.
 * @returns {void}
 */
function renderTopSummary(business) {
    const ownerNameElement = document.getElementById("owner-name");
    const openStatusElement = document.getElementById("open-status");
    const todayHoursElement = document.getElementById("today-hours");

    ownerNameElement.textContent = business.ownerName || "Business owner";

    const todaySchedule = getTodaySchedule(business.timetable || []);
    const hasTodaySchedule = Boolean(todaySchedule && !todaySchedule.isClosed);
    const currentlyOpen = isCurrentlyOpen(todaySchedule);

    openStatusElement.textContent = currentlyOpen ? "Open" : "Closed";
    openStatusElement.className = currentlyOpen ? "open" : "closed";

    if (!hasTodaySchedule) {
        todayHoursElement.textContent = "today";
        return;
    }

    todayHoursElement.textContent = `${formatTime12Hour(todaySchedule.opensAt)} - ${formatTime12Hour(todaySchedule.closesAt)} today`;
}

/**
 * Renders business contact information in the sidebar.
 * @param {Object} business - Business object from API.
 * @returns {void}
 */
function renderContactInfo(business) {
    const contactPhoneElement = document.getElementById("contact-phone");
    const contactEmailElement = document.getElementById("contact-email");
    const contactWebsiteElement = document.getElementById("contact-website");
    const contactAddressElement = document.getElementById("contact-address");

    contactPhoneElement.innerHTML = `<i class="bi bi-telephone"></i> ${business.contactPhone || "Phone not listed"}`;
    contactEmailElement.innerHTML = `<i class="bi bi-envelope"></i> ${business.contactEmail || "Email not listed"}`;

    if (business.websiteUrl) {
        contactWebsiteElement.innerHTML = `<i class="bi bi-globe"></i> <a href="${business.websiteUrl}" target="_blank" rel="noreferrer">${business.websiteUrl}</a>`;
    } else {
        contactWebsiteElement.innerHTML = "<i class=\"bi bi-globe\"></i> Website not listed";
    }

    contactAddressElement.innerHTML = `<i class="bi bi-geo-alt"></i> ${business.address || "Address not listed"}`;
}

/**
 * Configures share button actions for copy, social, and email options.
 * @param {Object} business - Business object from API.
 * @returns {void}
 */
function setupShareButton(business) {
    const shareButton = document.getElementById("share-btn");
    if (!shareButton) return;

    shareButton.onclick = async () => {
        const shareMessage = `${business.name}
            ${business.shortDescription || business.description || ""}
            Shared from Byte-Sized Business Boost desktop app`;

        if (navigator.share) {
            try {
                await navigator.share({ title: business.name, text: shareMessage });
                return;
            } catch (error) {
                console.warn("Native share cancelled", error);
            }
        }

        const encodedText = encodeURIComponent(shareMessage);

        const selected = window.prompt(
            "Type option: copy, email, x",
            "copy"
        );

        if (!selected) return;
        const choice = selected.toLowerCase();

        if (choice === "copy") {
            await navigator.clipboard.writeText(shareMessage);
            alert("Business details copied to clipboard");
            return;
        }

        if (choice === "email") {
            window.location.href = `mailto:?subject=${encodeURIComponent(`Check out ${business.name}`)}&body=${encodedText}`;
            return;
        }

        if (choice === "x") {
            window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, "_blank");
        }
    };
}

/**
 * Renders the weekly timetable section for a business.
 * @param {Array<{day: string, isClosed: boolean, opensAt: (string|null), closesAt: (string|null)}>} timetable - Timetable entries.
 */
function renderTimetable(timetable = []) {
    const timetableElement = document.getElementById("timetable");
    if (!timetableElement) return;

    if (!Array.isArray(timetable) || timetable.length === 0) {
        timetableElement.innerHTML = '<p class="mb-0">Opening hours unavailable.</p>';
        return;
    }

    timetableElement.innerHTML = timetable
        .map((entry) => {
            const hours = entry.isClosed ? "Closed" : `${formatTime12Hour(entry.opensAt)} - ${formatTime12Hour(entry.closesAt)}`;

            return `
                <div class="info-row">
                    <span class="info-day">${formatDay(entry.day)}</span>
                    <span class="info-hours ${entry.isClosed ? "closed" : "open"}">${hours}</span>
                </div>
            `;
        })
        .join("");
}

/**
 * Renders active deals that are currently valid based on date and active flag.
 * @param {Array<{title: string, description: string, startDate: string|Date, endDate: string|Date, isActive?: boolean}>} deals - Deal list from API.
 */
function renderRunningDeals(deals = []) {
    const dealsElement = document.getElementById("deals");
    const dealsSidebarCard = document.getElementById("deals-sidebar-card");
    if (!dealsElement || !dealsSidebarCard) return;

    const now = new Date();
    const runningDeals = deals.filter((deal) => {
        if (deal.isActive === false) return false;

        const startDate = new Date(deal.startDate);
        const endDate = new Date(deal.endDate);
        return now >= startDate && now <= endDate;
    });

    if (runningDeals.length === 0) {
        dealsSidebarCard.style.display = "none";
        dealsElement.innerHTML = "";
        return;
    }

    dealsSidebarCard.style.display = "block";
    dealsElement.innerHTML = runningDeals
        .map((deal) => `
            <article class="deal-card">
                <h5 class="deal-title">${deal.title}</h5>
                <p class="deal-description">${deal.description}</p>
                <p class="deal-range mb-0">${formatDealDate(deal.startDate)} - ${formatDealDate(deal.endDate)}</p>
            </article>
        `)
        .join("");
}

/**
 * Renders a 5-to-1 star rating distribution based on review ratings.
 * @param {Array<{rating: number}>} reviewData - Review objects returned by the API.
 */
function renderReviewBreakdown(reviewData = []) {
    const breakdownElement = document.getElementById("review-breakdown");
    if (!breakdownElement) return;

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviewData.forEach((review) => {
        const bucket = Math.ceil(Number(review.rating));
        if (bucket >= 1 && bucket <= 5) {
            starCounts[bucket] += 1;
        }
    });

    const total = reviewData.length;

    breakdownElement.innerHTML = REVIEW_STAR_BUCKETS.map((stars) => {
        const count = starCounts[stars];
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

        return `
            <div class="review-breakdown-row">
                <span class="stars-label">${stars}★</span>
                <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}">
                    <div class="progress-bar bg-warning" style="width: ${percentage}%"></div>
                </div>
                <span class="stars-count">${count}</span>
            </div>
        `;
    }).join("");
}

/**
 * Fetches review statistics and updates the average, review count, and star breakdown.
 * @returns {Promise<void>}
 */
async function loadReviewStatistics() {
    const reviewsResponse = await fetch(`/api/reviews/${BUSINESS_ID}`);
    const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];

    if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);
        ratingElement.textContent = averageRating;
        reviewCountElement.textContent = `(${reviews.length} reviews)`;
    } else {
        ratingElement.textContent = "0";
        reviewCountElement.textContent = "(0 reviews)";
    }

    renderReviewBreakdown(reviews);
}

/**
 * Fetches business-level favourite counts and updates the header metric.
 * @returns {Promise<void>}
 */
async function loadFavouriteStatistics() {
    const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
    if (!businessResponse.ok) throw new Error("Failed to fetch business");

    const business = await businessResponse.json();

    if (favouriteCountElement) {
        favouriteCountElement.textContent = `| ${business.favouritesCount} favourites`;
    }
}

/**
 * Loads business details and renders all sections on the business detail page.
 * @returns {Promise<void>}
 */
async function loadBusiness() {
    try {
        const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
        if (!businessResponse.ok) throw new Error("Failed to fetch business");

        const business = await businessResponse.json();

        const businessLogo = document.getElementById("business-logo");
        businessLogo.src = business.logoImageUrl;
        businessLogo.alt = business.name;

        document.getElementById("business-name").textContent = business.name;

        const categoriesContainer = document.getElementById("categories");
        categoriesContainer.innerHTML = business.categories
            .map((category) => `<span class="badge bg-primary me-1">${category}</span>`)
            .join("");

        document.getElementById("short-description").textContent = business.shortDescription || business.description || "";
        document.getElementById("long-description").textContent = business.longDescription || business.description || "";

        renderTopSummary(business);
        renderContactInfo(business);
        setupShareButton(business);
        renderTimetable(business.timetable);
        renderRunningDeals(business.deals || []);

        await Promise.all([loadFavouriteStatistics(), loadReviewStatistics()]);

        if (typeof setupReviewBox === "function") {
            await setupReviewBox(BUSINESS_ID, userToken);
        }

        if (typeof loadReviews === "function") {
            await loadReviews();
        }
    } catch (error) {
        console.error(error);
    }
}

loadBusiness();