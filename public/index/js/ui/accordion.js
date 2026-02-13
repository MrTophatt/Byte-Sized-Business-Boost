let sortBy = "relevance";
let perPage = 12;

const savedSort = sessionStorage.getItem("filter_sortBy");
const savedPerPage = sessionStorage.getItem("filter_perPage");

if (savedSort) sortBy = savedSort;
if (savedPerPage) perPage = Number(savedPerPage);

const STORAGE_KEYS = {
    sortBy: "filter_sortBy",
    perPage: "filter_perPage"
};

function syncTopFiltersUI() {
    // Sort UI
    document.querySelectorAll("#sortDropdown .dropdown-item").forEach(btn => {
        const isActive = btn.dataset.value.toUpperCase() === sortBy.toUpperCase();
        btn.classList.toggle("selected", isActive);

        if (isActive) {
            document.getElementById("sortButtonText").textContent =
                sortBy.charAt(0).toUpperCase() + sortBy.slice(1);
        }
    });

    // Per-page UI
    document.querySelectorAll("#perPageDropdown .dropdown-item").forEach(btn => {
        const isActive = Number(btn.dataset.value) === perPage;
        btn.classList.toggle("selected", isActive);

        if (isActive) {
            document.getElementById("perPageButtonText").textContent = btn.dataset.value;
        }
    });
}

function setupAccordionSelection(dropdownId, buttonTextId, currentValue) {
    const dropdown = document.getElementById(dropdownId);
    const buttonText = document.getElementById(buttonTextId);

    dropdown.querySelectorAll(".dropdown-item").forEach(btn => {
        // Restore selected state
        if (btn.dataset.value === String(currentValue)) {
            btn.classList.add("selected");

            if (dropdownId === "sortDropdown") {
                buttonText.textContent =
                    btn.dataset.value.charAt(0).toUpperCase() + btn.dataset.value.slice(1);
            } else {
                buttonText.textContent = btn.dataset.value;
            }
        }

        btn.addEventListener("click", () => {
            dropdown
                .querySelectorAll(".dropdown-item")
                .forEach(i => i.classList.remove("selected"));

            btn.classList.add("selected");

            bootstrap.Collapse.getInstance(dropdown).hide();
        });
    });
}

setupAccordionSelection("sortDropdown", "sortButtonText");
setupAccordionSelection("perPageDropdown", "perPageButtonText");

// Sort By Buttons
document.querySelectorAll('#sortDropdown .dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
        sortBy = btn.dataset.value;
        sessionStorage.setItem("filter_sortBy", sortBy);

        bootstrap.Collapse
            .getInstance(document.getElementById('sortDropdown'))
            .hide();

        syncTopFiltersUI();
        currentPage = 1;
        loadBusinesses();
    });
});

// Items Per Page Buttons
document.querySelectorAll('#perPageDropdown .dropdown-item').forEach(btn => {
    btn.addEventListener('click', () => {
        perPage = Number(btn.dataset.value);
        sessionStorage.setItem("filter_perPage", perPage);

        bootstrap.Collapse
            .getInstance(document.getElementById('perPageDropdown'))
            .hide();

        syncTopFiltersUI();
        currentPage = 1;
        loadBusinesses();
    });
});

document.addEventListener("DOMContentLoaded", () => {
    syncTopFiltersUI();
});