import "./auth.js";
import "./ui/accordion.js";
import "./ui/pagination.js";

window.addEventListener("pageshow", () => {
    updateFavourites();
    loadCategoryState();
    loadCategories();
    loadBusinesses();
});

window.addEventListener("DOMContentLoaded", () => {
    updateFavourites();
    loadCategoryState();
    loadCategories();
    loadBusinesses();
});