const mongoose = require("mongoose");

/**
 * Maps business category identifiers to Bootstrap icon classes.
 * Used for consistent category rendering across the UI.
 */
const BUSINESS_CATEGORIES = {
    food: "bi-egg-fried",
    cafe: "bi-cup-hot",
    retail: "bi-bag",
    services: "bi-tools",
    health: "bi-heart-pulse",
    education: "bi-mortarboard",
    entertainment: "bi-controller",
    technology: "bi-cpu",
    fitness: "bi-activity"
};

/**
 * Regex used to validate 24-hour time strings (HH:mm).
 * Ensures opening/closing times are stored in a consistent format.
 */
const TIME_24H_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Canonical weekday order.
 * Used for validation and default timetable generation.
 */
const DAYS_OF_WEEK = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
];

/**
 * Embedded schema representing a limited-time deal or promotion.
 * Stored directly inside the Business document.
 */
const dealSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    // Date when the deal becomes active
    startDate: {
        type: Date,
        required: true
    },

    // Date when the deal expires
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                // Prevent deals from ending before they start
                return !this.startDate || value >= this.startDate;
            },
            message: "Deal end date must be on or after start date"
        }
    },

    // Allows deals to be soft-disabled without deletion
    isActive: {
        type: Boolean,
        default: true
    }
}, { _id: false });

/**
 * Embedded schema representing opening hours for a single weekday.
 */
const timetableDaySchema = new mongoose.Schema({
    day: {
        type: String,
        enum: DAYS_OF_WEEK,
        required: true
    },

    // Indicates whether the business is closed on this day
    isClosed: {
        type: Boolean,
        default: false
    },

    // Opening time in HH:mm (24-hour format)
    opensAt: {
        type: String,
        default: null,
        validate: {
            validator(value) {
                return value === null || TIME_24H_PATTERN.test(value);
            },
            message: "Opening time must be in HH:mm format"
        }
    },

    // Closing time in HH:mm (24-hour format)
    closesAt: {
        type: String,
        default: null,
        validate: {
            validator(value) {
                return value === null || TIME_24H_PATTERN.test(value);
            },
            message: "Closing time must be in HH:mm format"
        }
    }
}, { _id: false });

/**
 * Require opening time when a day is marked as open.
 */
timetableDaySchema.path("opensAt").validate(function (value) {
    return this.isClosed || !!value;
}, "Opening time is required when day is open");

/**
 * Require closing time when a day is marked as open.
 */
timetableDaySchema.path("closesAt").validate(function (value) {
    return this.isClosed || !!value;
}, "Closing time is required when day is open");

/**
 * Main Business schema.
 * Represents a local business listed on the platform.
 */
const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    // Short and long descriptions for preview and detail views
    shortDescription: String,
    longDescription: String,

    /**
     * Business categories.
     * Must match predefined category keys for filtering consistency.
     */
    categories: {
        type: [String],
        enum: Object.keys(BUSINESS_CATEGORIES),
        required: true
    },

    ownerName: {
        type: String,
        default: "Business owner"
    },

    // Contact and location information
    contactPhone: String,
    contactEmail: String,
    websiteUrl: String,
    address: String,

    /**
     * Weekly opening hours.
     * Must contain exactly one entry for each day of the week.
     */
    timetable: {
        type: [timetableDaySchema],
        validate: {
            validator(days) {
                // Enforce full 7-day coverage to simplify UI rendering
                if (!Array.isArray(days) || days.length !== DAYS_OF_WEEK.length) {
                    return false;
                }

                const uniqueDays = new Set(days.map(d => d.day));
                return DAYS_OF_WEEK.every(day => uniqueDays.has(day));
            },
            message: "Timetable must include one entry for each day of the week"
        },

        // Default: closed every day
        default: DAYS_OF_WEEK.map(day => ({
            day,
            isClosed: true,
            opensAt: null,
            closesAt: null
        }))
    },

    // Promotional deals associated with this business
    deals: {
        type: [dealSchema],
        default: []
    },

    // Images used in cards and detail views
    bannerImageUrl: {
        type: String,
        default: "/images/defaultBusiness.png"
    },

    logoImageUrl: {
        type: String,
        default: "/images/defaultBusiness.png"
    }
});

module.exports = {
    Business: mongoose.model("Business", businessSchema),
    BUSINESS_CATEGORIES,
    DAYS_OF_WEEK
};