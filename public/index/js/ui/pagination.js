let currentPage = 1;
let totalPages = 1;

const pagination = document.getElementById("pagination");

function renderPagination() {
    pagination.innerHTML = "";

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