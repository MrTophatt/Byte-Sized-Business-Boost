const userToken = localStorage.getItem("userToken");
const avatar = document.getElementById("avatar");
const container = document.getElementById("businessList");
const favIcon = document.getElementById("favorite-icon");
const searchInput = document.getElementById("searchInput");
const categoryToggle = document.getElementById("categoryToggle");
const categoryDropdown = document.getElementById("categoryDropdown");
const pagination = document.getElementById("pagination");
let currentRequestId = 0;
let searchTimeout = null;
let sortBy = "relevance";
let perPage = 12;
let currentPage = 1;
let totalPages = 1;

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    if (userToken) {
        await fetch("/api/users/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-user-token": userToken }
        });
    }

    localStorage.removeItem("userToken");
    window.location.href = "/login";
});

function setupAccordionSelection(dropdownId, buttonTextId) {
    const dropdown = document.getElementById(dropdownId);
    const buttonText = document.getElementById(buttonTextId);

    dropdown.querySelectorAll('.dropdown-item').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update button text
            buttonText.textContent = btn.dataset.value;

            // Remove 'selected' class from all items
            dropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));

            // Add 'selected' to clicked item
            btn.classList.add('selected');

            // Close dropdown
            bootstrap.Collapse.getInstance(dropdown).hide();
        });
    });

    // Initialize default selection on page load
    const defaultValue = buttonText.textContent;
    const defaultItem = Array.from(dropdown.querySelectorAll('.dropdown-item'))
        .find(i => i.dataset.value === defaultValue);
    if (defaultItem) defaultItem.classList.add('selected');
}

// Setup
setupAccordionSelection('sortDropdown', 'sortButtonText');
setupAccordionSelection('perPageDropdown', 'perPageButtonText');

// Sort By Buttons
document.querySelectorAll('#sortDropdown .dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('sortButtonText').textContent = btn.dataset.value.charAt(0).toUpperCase() + btn.dataset.value.slice(1);
        // Close the dropdown
        bootstrap.Collapse.getInstance(document.getElementById('sortDropdown')).hide();
        sortBy = document.getElementById('sortButtonText').textContent.toLowerCase();
        loadBusinesses();
        loadCategories();
    });
});

// Items Per Page Buttons
document.querySelectorAll('#perPageDropdown .dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('perPageButtonText').textContent = btn.dataset.value;
        bootstrap.Collapse.getInstance(document.getElementById('perPageDropdown')).hide();
        perPage = Number(btn.dataset.value);
        loadBusinesses();
        loadCategories();
    });
});

searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        loadBusinesses();
        loadCategories();
    }, 300); // debounce delay
});


async function loadUser() {
    if (!userToken) return window.location.href = "/login";

    const res = await fetch("/api/users/me", {
        headers: { "x-user-token": userToken }
    });

    if (!res.ok) {
        localStorage.removeItem("userToken");
        return window.location.href = "/login";
    }

    const user = await res.json();

    // Avatar logic
    const avatar = document.getElementById("avatar");
    if (user.role === "guest") {
        avatar.src = "/images/defaultAvatar.png";
        avatar.style.filter = `hue-rotate(${user.avatarHue}deg) saturate(20)`;
    } else {
        avatar.src = user.avatarUrl;
        avatar.style.filter = ""; // no hue for Google avatar
    }

    // Show guest badge only if user is guest
    const badge = document.getElementById("roleBadge");
    if (user.role === "guest") {
        badge.style.display = "inline-block";
    } else {
        badge.style.display = "none";
    }
}
loadUser();

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function getHueFromToken(userToken) {
    return Math.abs(hashString(userToken)) % 360;
}
const hue = getHueFromToken(userToken);
avatar.src = "/images/defaultAvatar.png";
avatar.style.filter = `
    hue-rotate(${hue}deg)
    saturate(20)
`;

async function updateFavorites() {
    if (!userToken) return; // guest

    let favorites = [];
    try {
        const res = await fetch("/api/users/favorites", {
            headers: { "x-user-token": userToken }
        });
        if (res.ok) {
            const data = await res.json();
            favorites = data.favorites;
        }
    } catch (err) {
        console.error("Failed to update favorites", err);
        return;
    }

    // Update each business card
    document.querySelectorAll(".card").forEach(card => {
        const businessLink = card.querySelector("a");
        if (!businessLink) return;

        // Extract business ID from href
        const href = businessLink.getAttribute("href"); // /business/:id
        const id = href.split("/").pop();

        const heartIcon = card.querySelector(".favorite-icon");
        if (!heartIcon) return;

        if (favorites.includes(id)) {
            heartIcon.style.display = "block"; // show heart
        } else {
            heartIcon.style.display = "none"; // hide heart
        }
    });
}

function renderPagination() {
    pagination.innerHTML = "";

    console.log(totalPages)

    if (totalPages <= 1) {
        pagination.innerHTML = "";
        pagination.parentElement.style.display = "none";
        return;
    }

    pagination.parentElement.style.display = "flex";
    pagination.innerHTML = "";

    function addButton(label, page, isActive = false) {
        const btn = document.createElement("button");
        btn.textContent = label;

        if (isActive) btn.classList.add("active");

        btn.onclick = () => {
            currentPage = page;
            loadBusinesses();
            loadCategories();
        };

        pagination.appendChild(btn);
    }

    function addEllipsis() {
        const span = document.createElement("span");
        span.textContent = "…";
        span.className = "ellipsis";
        pagination.appendChild(span);
    }

    // FIRST
    addButton("1", 1, currentPage === 1);

    // LEFT ELLIPSIS
    if (currentPage > 3) addEllipsis();

    // PREVIOUS PAGE (always show if exists and not page 1)
    if (currentPage > 2) addButton(currentPage - 1, currentPage - 1);

    // CURRENT (if not first or last)
    if (currentPage !== 1 && currentPage !== totalPages) addButton(currentPage, currentPage, true);

    // NEXT PAGE
    if (currentPage < totalPages - 1) addButton(currentPage + 1, currentPage + 1);

    // RIGHT ELLIPSIS
    if (currentPage < totalPages - 2) addEllipsis();

    // LAST
    if (totalPages > 1) {
        addButton(
            totalPages.toString(),
            totalPages,
            currentPage === totalPages
        );
    }
}

async function loadBusinesses() {
    const res = await fetch("/api/businesses");
    let businesses = await res.json();

    const search = document.getElementById("searchInput").value.toLowerCase();

    // SEARCH
    businesses = businesses.filter(b =>
        b.name.toLowerCase().includes(search) ||
        b.description.toLowerCase().includes(search)
    );

    // SORT
    if (sortBy === "rating") {
        businesses.sort((a, b) => b.rating - a.rating);
    }
    if (sortBy === "reviews") {
        businesses.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    // Get included categories (from buttons with .active)
    const includedCategories = Array.from(
        document.querySelectorAll(".category-row .category-btn.include.active")
    ).map(btn => btn.dataset.value);

    // Get excluded categories (from rows with .excluded)
    const excludedCategories = Array.from(
        document.querySelectorAll(".category-row.excluded")
    ).map(row => row.querySelector(".category-btn.include").dataset.value);

    // Filter businesses
    businesses = businesses.filter(business => {
        const cats = business.categories;

        // Exclude takes priority
        if (excludedCategories.some(c => cats.includes(c))) return false;

        // If any included categories selected, only show those
        if (includedCategories.length > 0) {
            return cats.some(c => includedCategories.includes(c));
        }

        // Otherwise, include all
        return true;
    });

    // PAGINATION CALC
    totalPages = Math.ceil(businesses.length / perPage);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    businesses = businesses.slice(start, end);

    let favorites = [];
    if (userToken) {
        const favRes = await fetch("/api/users/favorites", {
            headers: { "x-user-token": userToken }
        });
        if (favRes.ok) {
            favorites = (await favRes.json()).favorites;
        }
    }

    container.innerHTML = "";
    businesses.forEach(business => {
        const isFavorited = favorites.includes(business._id);

        const div = document.createElement("div");
        div.innerHTML = `
            <div class="card h-100 position-relative bg-dark text-light">
                <a href="/business/${business._id}" class="text-decoration-none text-light">
                    <img src="${business.imageUrl}" class="card-img-top">
                    ${
                        isFavorited
                            ?   `<div class="favorite-icon">
                                    <svg viewBox="0 0 24 24" fill="#d6336c">
                                        <path d="M12 21s-7.5-4.7-10-9c-2-3.4.5-8 5-8 2.5 0 4 2 5 3.5C13 6 14.5 4 17 4c4.5 0 7 4.6 5 8-2.5 4.3-10 9-10 9z"/>
                                    </svg>
                                </div>`
                            : ""
                    }
                    <div class="card-body">
                        <h5>${business.name}</h5>
                        <p class="small">${business.description}</p>
                        <div class="mb-2">
                            ${business.categories.map(c =>
                                `<span class="badge bg-primary me-1">${c}</span>`
                            ).join("")}
                        </div>
                        <small>⭐ ${business.rating} (${business.reviewCount})</small>
                    </div>
                </a>
            </div>
        `;
        container.appendChild(div);
    });

    renderPagination();
}

window.addEventListener("pageshow", () => {
    // Re-load favorites
    updateFavorites();
    loadBusinesses();
    loadCategories();
});

function renderCategoryFilters(categories) {
    categoryDropdown.innerHTML = "";

    categories.forEach(category => {
        const label = document.createElement("label");
        label.innerHTML = `
            <input type="checkbox" value="${category}">
            ${category}
        `;

        label.querySelector("input").addEventListener("change", () => {
            loadBusinesses();
            loadCategories();
        });

        categoryDropdown.appendChild(label);
    });
}

categoryToggle?.addEventListener("click", () => {
    categoryDropdown.classList.toggle("hidden");
});

async function loadCategories() {
    const res = await fetch("/api/categories");
    const categories = await res.json();

    const body = document.querySelector("#categoryDropdown .accordion-body");
    body.innerHTML = "";

    categories.forEach(category => {
        // Row container
        const row = document.createElement("div");
        row.className = "category-row";

        // Include bean
        const includeBtn = document.createElement("button");
        includeBtn.type = "button";
        includeBtn.className = "category-btn include";
        includeBtn.dataset.value = category;

        // Label inside bean
        const labelSpan = document.createElement("span");
        labelSpan.className = "label";
        labelSpan.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        includeBtn.appendChild(labelSpan);

        // Deny icon inside bean
        const denyIcon = document.createElement("i");
        denyIcon.className = "bi bi-slash-circle deny-icon";
        includeBtn.appendChild(denyIcon);

        // Exclude button (small)
        const excludeBtn = document.createElement("button");
        excludeBtn.type = "button";
        excludeBtn.className = "category-btn exclude";
        excludeBtn.innerHTML = `<i class="bi bi-slash-circle"></i>`;
        excludeBtn.title = "Exclude category";

        // --------------------------
        // Include button behavior
        // --------------------------
        includeBtn.addEventListener("click", () => {
            if (row.classList.contains("excluded")) {
                // Excluded → neutral
                row.classList.remove("excluded");
                console.log(includeBtn.innte)
                includeBtn.innerHTML =  includeBtn.innerHTML.replace('<i class="bi bi-slash-circle"></i>', "")
            } else {
                // Toggle include
                includeBtn.classList.toggle("active");
            }

            // Reload businesses after filter change
            currentPage = 1;
            loadBusinesses();
        });

        // --------------------------
        // Exclude button behavior
        // --------------------------
        excludeBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            // Remove include active
            includeBtn.classList.remove("active");

            // Set row as excluded
            row.classList.add("excluded");
            includeBtn.innerHTML += '<i class="bi bi-slash-circle"></i>'

            // Reload businesses
            currentPage = 1;
            loadBusinesses();
        });

        // Append buttons to row
        row.appendChild(includeBtn);
        row.appendChild(excludeBtn);

        // Append row to accordion body
        body.appendChild(row);
    });
}