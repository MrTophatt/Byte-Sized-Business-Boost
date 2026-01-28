const CATEGORY_STORAGE_KEY = "categoryFilters";

let includedCategories = new Set();
let excludedCategories = new Set();

loadCategoryState();

async function loadCategories() {
    const res = await fetch("/api/categories");
    const categories = await res.json();

    const body = document.querySelector("#categoryDropdown .accordion-body");
    body.innerHTML = "";

    categories.forEach(({ value, icon }) => {
        const row = document.createElement("div");
        row.className = "category-row";

        const includeBtn = document.createElement("button");
        includeBtn.type = "button";
        includeBtn.className = "category-btn include";
        includeBtn.dataset.value = value;

        includeBtn.innerHTML = `
            <i class="bi ${icon} me-2"></i>
                <span class="label">
                    ${value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
            <i class="bi bi-slash-circle deny-icon ms-2"></i>
        `;

        const excludeBtn = document.createElement("button");
        excludeBtn.type = "button";
        excludeBtn.className = "category-btn exclude";
        excludeBtn.innerHTML = `<i class="bi bi-slash-circle"></i>`;
        excludeBtn.title = "Exclude category";

        // -----------------------
        // RESTORE STATE
        // -----------------------
        if (excludedCategories.has(value)) {
            row.classList.add("excluded");
            includeBtn.classList.add("excluded");
        } else if (includedCategories.has(value)) {
            includeBtn.classList.add("active");
        }

        // -----------------------
        // INCLUDE CLICK
        // -----------------------
        includeBtn.addEventListener("click", () => {
            if (excludedCategories.has(value)) {
                // Excluded → neutral
                excludedCategories.delete(value);
                row.classList.remove("excluded");
                includeBtn.classList.remove("excluded");
            } else {
                // Toggle include
                if (includedCategories.has(value)) {
                    includedCategories.delete(value);
                    includeBtn.classList.remove("active");
                } else {
                    includedCategories.add(value);
                    includeBtn.classList.add("active");
                }
            }

            saveCategoryState();
            currentPage = 1;
            loadBusinesses();
        });

        // -----------------------
        // EXCLUDE CLICK
        // -----------------------
        excludeBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            includedCategories.delete(value);
            excludedCategories.add(value);

            includeBtn.classList.remove("active");
            includeBtn.classList.add("excluded");
            row.classList.add("excluded");

            saveCategoryState();
            currentPage = 1;
            loadBusinesses();
        });

        row.appendChild(includeBtn);
        row.appendChild(excludeBtn);
        body.appendChild(row);
    });
}

function clearCategoryFilters() {
    includedCategories.clear();
    excludedCategories.clear();
    saveCategoryState();
    loadCategories();
    loadBusinesses();
}

function saveCategoryState() {
    localStorage.setItem(
        CATEGORY_STORAGE_KEY,
        JSON.stringify({
            included: [...includedCategories],
            excluded: [...excludedCategories]
        })
    );
}

function loadCategoryState() {
    const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!saved) return;

    try {
        const parsed = JSON.parse(saved);

        includedCategories = new Set(parsed.included || []);
        excludedCategories = new Set(parsed.excluded || []);
    } catch (err) {
        console.warn("Invalid category filter state, resetting.");
        includedCategories = new Set();
        excludedCategories = new Set();
        localStorage.removeItem(CATEGORY_STORAGE_KEY);
    }
}