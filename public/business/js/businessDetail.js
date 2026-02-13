const id = BUSINESS_ID;
const ratingElement = document.getElementById("rating");
const reviewCountElement = document.getElementById("review-count");
const favouriteCountElement = document.getElementById("favourite-count");
let reviews;

function formatDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatDealDate(dateValue) {
    const date = new Date(dateValue);
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function renderTimetable(timetable = []) {
    const timetableElement = document.getElementById("timetable");
    if (!timetableElement) return;

    if (!Array.isArray(timetable) || timetable.length === 0) {
        timetableElement.innerHTML = '<p class="mb-0">Opening hours unavailable.</p>';
        return;
    }

    timetableElement.innerHTML = timetable
        .map((entry) => {
            const hours = entry.isClosed
                ? "Closed"
                : `${entry.opensAt} - ${entry.closesAt}`;

            return `
                <div class="info-row">
                    <span class="info-day">${formatDay(entry.day)}</span>
                    <span class="info-hours ${entry.isClosed ? "closed" : "open"}">${hours}</span>
                </div>
            `;
        })
        .join("");
}

function renderRunningDeals(deals = []) {
    const dealsElement = document.getElementById("deals");
    if (!dealsElement) return;

    const now = new Date();
    const runningDeals = deals.filter((deal) => {
        if (deal.isActive === false) return false;

        const startDate = new Date(deal.startDate);
        const endDate = new Date(deal.endDate);
        return now >= startDate && now <= endDate;
    });

    if (runningDeals.length === 0) {
        dealsElement.innerHTML = '<p class=" mb-0">No active deals right now.</p>';
        return;
    }

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

    breakdownElement.innerHTML = [5, 4, 3, 2, 1]
        .map((stars) => {
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
        })
        .join("");
}

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

async function loadFavouriteStatistics() {
    const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
    if (!businessResponse.ok) throw new Error("Failed to fetch business");

    const business = await businessResponse.json();

    if (favouriteCountElement) {
        favouriteCountElement.textContent = `| ${business.favouritesCount} favourites`;
    }
}

/* =========================
   LOAD BUSINESS
========================= */
async function loadBusiness() {
    try {
        const businessResponse = await fetch(`/api/businesses/${BUSINESS_ID}`);
        if (!businessResponse.ok) throw new Error("Failed to fetch business");

        const business = await businessResponse.json();

        const heroImage = document.getElementById("hero-image");
        heroImage.src = business.imageUrl;
        heroImage.alt = business.name;

        document.getElementById("business-name").textContent = business.name;

        const categoriesContainer = document.getElementById("categories");
        categoriesContainer.innerHTML = business.categories
            .map((category) => `<span class="badge bg-primary me-1">${category}</span>`)
            .join("");

        document.getElementById("description").textContent = business.description;

        renderTimetable(business.timetable);
        renderRunningDeals(business.deals || []);

        await Promise.all([loadFavouriteStatistics(), loadReviewStatistics()]);

        if (typeof loadReviews === "function") {
            await loadReviews();
        }

        if (typeof setupReviewBox === "function") {
            setupReviewBox(BUSINESS_ID, userToken);
        }
    } catch (error) {
        console.error(error);
    }
}

loadBusiness();