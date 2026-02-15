(function registerBusinessDetailRenderers() {
    const { REVIEW_STAR_BUCKETS } = window.businessDetailConstants;
    const {
        formatDay,
        formatDealDate,
        formatTime12Hour,
        getTodaySchedule,
        isCurrentlyOpen
    } = window.businessDetailUtils;

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
            const encodedUrl = encodeURIComponent(window.location.href);
            const shareMessage = `${business.name}\n${business.shortDescription || business.description || ""}\nShared from Byte-Sized Business Boost desktop app`;

            if (navigator.share) {
                try {
                    await navigator.share({ title: business.name, text: shareMessage, url: window.location.href });
                    return;
                } catch (error) {
                    console.warn("Native share cancelled", error);
                }
            }

            const encodedText = encodeURIComponent(shareMessage);
            const selectedOption = window.prompt("Type option: copy, email, x", "copy");

            if (!selectedOption) return;
            const shareChoice = selectedOption.toLowerCase();

            if (shareChoice === "copy") {
                await navigator.clipboard.writeText(shareMessage);
                alert("Business details copied to clipboard");
                return;
            }

            if (shareChoice === "email") {
                window.location.href = `mailto:?subject=${encodeURIComponent(`Check out ${business.name}`)}&body=${encodedText}`;
                return;
            }

            if (shareChoice === "x") {
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
     * Applies high-level business profile data to the page.
     * @param {Object} business Business object from API.
     * @returns {void}
     */
    function renderBusinessHeader(business) {
        const businessLogoElement = document.getElementById("business-logo");
        const businessNameElement = document.getElementById("business-name");
        const categoriesContainer = document.getElementById("categories");
        const shortDescriptionElement = document.getElementById("short-description");
        const longDescriptionElement = document.getElementById("long-description");

        businessLogoElement.src = business.logoImageUrl;
        businessLogoElement.alt = business.name;
        businessNameElement.textContent = business.name;

        categoriesContainer.innerHTML = business.categories
            .map((category) => `<span class="badge bg-primary me-1">${category}</span>`)
            .join("");

        shortDescriptionElement.textContent = business.shortDescription || business.description || "";
        longDescriptionElement.textContent = business.longDescription || business.description || "";
    }

    window.businessDetailRenderers = {
        renderTopSummary,
        renderContactInfo,
        setupShareButton,
        renderTimetable,
        renderRunningDeals,
        renderReviewBreakdown,
        renderBusinessHeader
    };
}());