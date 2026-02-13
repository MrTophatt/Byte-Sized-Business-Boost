const mongoose = require("mongoose");

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

const DAYS_OF_WEEK = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
];

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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                return !this.startDate || value >= this.startDate;
            },
            message: "Deal end date must be on or after start date"
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const timetableDaySchema = new mongoose.Schema({
    day: {
        type: String,
        enum: DAYS_OF_WEEK,
        required: true
    },
    isClosed: {
        type: Boolean,
        default: false
    },
    opensAt: {
        type: String,
        default: null,
        validate: {
            validator(value) {
                return value === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
            },
            message: "Opening time must be in HH:mm format"
        }
    },
    closesAt: {
        type: String,
        default: null,
        validate: {
            validator(value) {
                return value === null || /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
            },
            message: "Closing time must be in HH:mm format"
        }
    }
}, { _id: false });

timetableDaySchema.path("opensAt").validate(function(value) {
    return this.isClosed || !!value;
}, "Opening time is required when day is open");

timetableDaySchema.path("closesAt").validate(function(value) {
    return this.isClosed || !!value;
}, "Closing time is required when day is open");

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,

    categories: {
        type: [String],
        enum: Object.keys(BUSINESS_CATEGORIES),
        required: true
    },

    timetable: {
        type: [timetableDaySchema],
        validate: {
            validator(days) {
                if (!Array.isArray(days) || days.length !== DAYS_OF_WEEK.length) {
                    return false;
                }

                const uniqueDays = new Set(days.map((dayEntry) => dayEntry.day));
                return DAYS_OF_WEEK.every((day) => uniqueDays.has(day));
            },
            message: "Timetable must include one entry for each day of the week"
        },
        default: DAYS_OF_WEEK.map((day) => ({
            day,
            isClosed: true,
            opensAt: null,
            closesAt: null
        }))
    },

    deals: {
        type: [dealSchema],
        default: []
    },

    imageUrl: {
        type: String,
        default: "/images/defaultBusiness.png"
    }
});

module.exports = {
    Business: mongoose.model("Business", businessSchema),
    BUSINESS_CATEGORIES,
    DAYS_OF_WEEK
};