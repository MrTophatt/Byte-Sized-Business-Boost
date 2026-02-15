const mongoose = require("mongoose");
const { Business } = require("./models/Business");
const User = require("./models/User");
const Review = require("./models/Review");
const { connectDB } = require("./database");

const DAYS_OF_WEEK = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday"
];

const BUSINESS_SEED_DATA = [
    {
        name: "Maple Leaf Café",
        shortDescription: "A cozy local café for handcrafted coffee and pastries.",
        longDescription: "Maple Leaf Café is a neighborhood coffee shop known for small-batch brews, fresh pastries, and a calm space for students, remote workers, and weekend catch-ups.",
        description: "A cozy local café for handcrafted coffee and pastries.",
        categories: ["food", "cafe", "services"],
        ownerName: "Avery Thompson",
        contactPhone: "(416) 555-0101",
        contactEmail: "hello@mapleleafcafe.ca",
        websiteUrl: "https://mapleleafcafe.ca",
        address: "120 Queen St W, Toronto, ON",
        timetable: {
            monday: { opensAt: "07:30", closesAt: "17:00" },
            tuesday: { opensAt: "07:30", closesAt: "17:00" },
            wednesday: { opensAt: "07:30", closesAt: "17:00" },
            thursday: { opensAt: "07:30", closesAt: "17:00" },
            friday: { opensAt: "07:30", closesAt: "18:00" },
            saturday: { opensAt: "08:00", closesAt: "16:00" }
        },
        deals: [
            {
                title: "Student Morning Special",
                description: "10% off for students before 11:00 AM.",
                startDate: new Date("2026-01-01"),
                endDate: new Date("2026-12-31"),
                isActive: true
            }
        ],
        bannerImageUrl: "./images/businesses/banners/maple-leaf-cafe-banner.svg",
        logoImageUrl: "/images/businesses/logos/maple-leaf-cafe-logo.svg"
    },
    {
        name: "Northside Fitness",
        shortDescription: "Community-focused gym with classes and personal training.",
        longDescription: "Northside Fitness provides strength and cardio training, group classes, and one-on-one coaching with flexible memberships and beginner-friendly support.",
        description: "Community-focused gym with classes and personal training.",
        categories: ["fitness", "health", "services"],
        ownerName: "Jordan Patel",
        contactPhone: "(416) 555-0120",
        contactEmail: "team@northsidefitness.ca",
        websiteUrl: "https://northsidefitness.ca",
        address: "88 Bloor St E, Toronto, ON",
        timetable: {
            monday: { opensAt: "05:30", closesAt: "22:00" },
            tuesday: { opensAt: "05:30", closesAt: "22:00" },
            wednesday: { opensAt: "05:30", closesAt: "22:00" },
            thursday: { opensAt: "05:30", closesAt: "22:00" },
            friday: { opensAt: "05:30", closesAt: "21:00" },
            saturday: { opensAt: "07:00", closesAt: "19:00" },
            sunday: { opensAt: "08:00", closesAt: "18:00" }
        },
        deals: [
            {
                title: "New Member Trial",
                description: "Free first class for all new members.",
                startDate: new Date("2026-01-01"),
                endDate: new Date("2026-06-30"),
                isActive: true
            }
        ],
        bannerImageUrl: "./images/businesses/banners/northside-fitness-banner.svg",
        logoImageUrl: "/images/businesses/logos/northside-fitness-logo.svg"
    },
    {
        name: "TechNest Repairs",
        shortDescription: "Fast phone and laptop diagnostics and repairs.",
        longDescription: "TechNest Repairs helps residents and students with same-day diagnostics, screen and battery replacements, data recovery, and maintenance for common device issues.",
        description: "Fast phone and laptop diagnostics and repairs.",
        categories: ["technology", "services", "education"],
        ownerName: "Chris Nguyen",
        contactPhone: "(416) 555-0145",
        contactEmail: "support@technestrepairs.ca",
        websiteUrl: "https://technestrepairs.ca",
        address: "22 King St E, Toronto, ON",
        timetable: {
            monday: { opensAt: "09:00", closesAt: "18:00" },
            tuesday: { opensAt: "09:00", closesAt: "18:00" },
            wednesday: { opensAt: "09:00", closesAt: "18:00" },
            thursday: { opensAt: "09:00", closesAt: "18:00" },
            friday: { opensAt: "09:00", closesAt: "18:00" }
        },
        bannerImageUrl: "./images/businesses/banners/technest-repairs-banner.svg",
        logoImageUrl: "/images/businesses/logos/technest-repairs-logo.svg"
    },
    {
        name: "Bright Minds Tutoring",
        shortDescription: "After-school tutoring in math, science, and coding.",
        longDescription: "Bright Minds Tutoring offers personalized learning plans for middle-school through college students, with small sessions focused on confidence and long-term outcomes.",
        description: "After-school tutoring in math, science, and coding.",
        categories: ["education", "services"],
        ownerName: "Samantha Lee",
        contactPhone: "(416) 555-0188",
        contactEmail: "info@brightmindstutoring.ca",
        websiteUrl: "https://brightmindstutoring.ca",
        address: "350 College St, Toronto, ON",
        timetable: {
            monday: { opensAt: "15:00", closesAt: "20:00" },
            tuesday: { opensAt: "15:00", closesAt: "20:00" },
            wednesday: { opensAt: "15:00", closesAt: "20:00" },
            thursday: { opensAt: "15:00", closesAt: "20:00" },
            sunday: { opensAt: "10:00", closesAt: "14:00" }
        },
        bannerImageUrl: "./images/businesses/banners/bright-minds-tutoring-banner.svg",
        logoImageUrl: "/images/businesses/logos/bright-minds-tutoring-logo.svg"
    },
    {
        name: "Downtown Boutique",
        shortDescription: "Handmade clothing and accessories from local makers.",
        longDescription: "Downtown Boutique curates apparel, jewelry, and seasonal collections from independent creators, with new drops and limited runs released throughout the month.",
        description: "Handmade clothing and accessories from local makers.",
        categories: ["retail", "services", "entertainment"],
        ownerName: "Mila Rossi",
        contactPhone: "(416) 555-0166",
        contactEmail: "shop@downtownboutique.ca",
        websiteUrl: "https://downtownboutique.ca",
        address: "541 Dundas St W, Toronto, ON",
        timetable: {
            tuesday: { opensAt: "10:00", closesAt: "17:00" },
            wednesday: { opensAt: "10:00", closesAt: "17:00" },
            thursday: { opensAt: "10:00", closesAt: "17:00" },
            friday: { opensAt: "10:00", closesAt: "19:00" },
            saturday: { opensAt: "10:00", closesAt: "19:00" }
        },
        bannerImageUrl: "./images/businesses/banners/downtown-boutique-banner.svg",
        logoImageUrl: "/images/businesses/logos/downtown-boutique-logo.svg"
    },
    {
        name: "Neon Arcade & VR",
        shortDescription: "Retro arcades, VR rooms, and weekend tournaments.",
        longDescription: "Neon Arcade & VR blends classic cabinets with modern VR pods, offering birthday packages, esports ladders, and community game nights.",
        description: "Retro arcades, VR rooms, and weekend tournaments.",
        categories: ["entertainment", "technology", "services"],
        ownerName: "Diego Alvarez",
        contactPhone: "(416) 555-0202",
        contactEmail: "play@neonarcadevr.ca",
        websiteUrl: "https://neonarcadevr.ca",
        address: "14 Carlton St, Toronto, ON",
        timetable: {
            monday: { opensAt: "14:00", closesAt: "22:00" },
            tuesday: { opensAt: "14:00", closesAt: "22:00" },
            wednesday: { opensAt: "14:00", closesAt: "22:00" },
            thursday: { opensAt: "14:00", closesAt: "23:00" },
            friday: { opensAt: "12:00", closesAt: "01:00" },
            saturday: { opensAt: "10:00", closesAt: "01:00" },
            sunday: { opensAt: "10:00", closesAt: "21:00" }
        },
        deals: [
            {
                title: "Two-for-One Tuesday Tokens",
                description: "Buy one token bundle, get a second bundle free every Tuesday.",
                startDate: new Date("2026-02-01"),
                endDate: new Date("2026-12-31"),
                isActive: true
            }
        ],
    },
    {
        name: "Harbor Wellness Clinic",
        shortDescription: "Physio, massage therapy, and holistic recovery plans.",
        longDescription: "Harbor Wellness Clinic supports recovery through integrated treatment plans, mobility assessments, and guided rehabilitation for athletes and office workers.",
        description: "Physio, massage therapy, and holistic recovery plans.",
        categories: ["health", "services", "fitness"],
        ownerName: "Priya Menon",
        contactPhone: "(416) 555-0228",
        contactEmail: "care@harborwellnessclinic.ca",
        websiteUrl: "https://harborwellnessclinic.ca",
        address: "210 Queens Quay W, Toronto, ON",
        timetable: {
            monday: { opensAt: "08:00", closesAt: "19:00" },
            tuesday: { opensAt: "08:00", closesAt: "19:00" },
            wednesday: { opensAt: "08:00", closesAt: "19:00" },
            thursday: { opensAt: "08:00", closesAt: "19:00" },
            friday: { opensAt: "08:00", closesAt: "17:00" },
            saturday: { opensAt: "09:00", closesAt: "14:00" }
        },
        deals: [
            {
                title: "First Assessment Package",
                description: "Initial consultation and mobility screening bundled at 20% off.",
                startDate: new Date("2026-03-01"),
                endDate: new Date("2026-09-30"),
                isActive: true
            }
        ],
    },
    {
        name: "Green Fork Meal Prep",
        shortDescription: "Weekly chef-made meal prep with vegan and high-protein options.",
        longDescription: "Green Fork Meal Prep delivers rotating menu plans for families, athletes, and busy professionals with flexible pickup windows and custom nutrition plans.",
        description: "Weekly chef-made meal prep with vegan and high-protein options.",
        categories: ["food", "health", "services"],
        ownerName: "Noah Campbell",
        contactPhone: "(416) 555-0255",
        contactEmail: "orders@greenforkmeals.ca",
        websiteUrl: "https://greenforkmeals.ca",
        address: "77 Roncesvalles Ave, Toronto, ON",
        timetable: {
            monday: { opensAt: "09:00", closesAt: "18:00" },
            tuesday: { opensAt: "09:00", closesAt: "18:00" },
            wednesday: { opensAt: "09:00", closesAt: "18:00" },
            thursday: { opensAt: "09:00", closesAt: "18:00" },
            friday: { opensAt: "09:00", closesAt: "18:00" },
            sunday: { opensAt: "11:00", closesAt: "16:00" }
        },
        deals: [
            {
                title: "Family Box Intro",
                description: "First week family-sized meal box includes 3 free desserts.",
                startDate: new Date("2026-01-15"),
                endDate: new Date("2026-12-31"),
                isActive: true
            }
        ],
    },
    {
        name: "Summit Co-Work Studio",
        shortDescription: "Flexible coworking desks, private pods, and creator workshops.",
        longDescription: "Summit Co-Work Studio offers focused desk zones, podcast booths, and collaboration lounges for freelancers, startups, and distributed teams.",
        description: "Flexible coworking desks, private pods, and creator workshops.",
        categories: ["services", "technology", "education"],
        ownerName: "Emma Zhao",
        contactPhone: "(416) 555-0299",
        contactEmail: "hello@summitcowork.ca",
        websiteUrl: "https://summitcowork.ca",
        address: "401 Richmond St W, Toronto, ON",
        timetable: {
            monday: { opensAt: "07:00", closesAt: "22:00" },
            tuesday: { opensAt: "07:00", closesAt: "22:00" },
            wednesday: { opensAt: "07:00", closesAt: "22:00" },
            thursday: { opensAt: "07:00", closesAt: "22:00" },
            friday: { opensAt: "07:00", closesAt: "21:00" },
            saturday: { opensAt: "09:00", closesAt: "18:00" },
            sunday: { opensAt: "09:00", closesAt: "16:00" }
        },
        deals: [
            {
                title: "Night Owl Pass",
                description: "50% off desk bookings after 6 PM from Monday to Thursday.",
                startDate: new Date("2026-04-01"),
                endDate: new Date("2026-10-31"),
                isActive: true
            }
        ],
    },
    {
        name: "Riverstone Learning Hub",
        shortDescription: "Project-based workshops for robotics, design, and entrepreneurship.",
        longDescription: "Riverstone Learning Hub runs evening and weekend cohorts where learners build real projects in robotics, UX design, and startup fundamentals.",
        description: "Project-based workshops for robotics, design, and entrepreneurship.",
        categories: ["education", "technology"],
        ownerName: "Fatima El-Sayed",
        contactPhone: "(416) 555-0311",
        contactEmail: "admissions@riverstonehub.ca",
        websiteUrl: "https://riverstonehub.ca",
        address: "98 Spadina Ave, Toronto, ON",
        timetable: {
            tuesday: { opensAt: "13:00", closesAt: "21:00" },
            wednesday: { opensAt: "13:00", closesAt: "21:00" },
            thursday: { opensAt: "13:00", closesAt: "21:00" },
            friday: { opensAt: "13:00", closesAt: "21:00" },
            saturday: { opensAt: "09:00", closesAt: "17:00" },
            sunday: { opensAt: "10:00", closesAt: "16:00" }
        },
        deals: [
            {
                title: "Bootcamp Bundle",
                description: "Enroll in two weekend bootcamps and save 25% on the second.",
                startDate: new Date("2026-05-01"),
                endDate: new Date("2026-12-15"),
                isActive: true
            }
        ],
    }
];

/**
 * Builds a complete 7-day timetable from partial daily opening data.
 * @param {Object<string, {opensAt: string, closesAt: string}>} hoursByDay - Day-to-hours map.
 * @returns {Array<{day: string, isClosed: boolean, opensAt: (string|null), closesAt: (string|null)}>} Timetable for all weekdays.
 */
function createTimetable(hoursByDay = {}) {
    return DAYS_OF_WEEK.map((day) => {
        const dayHours = hoursByDay[day];

        if (!dayHours) {
            return { day, isClosed: true, opensAt: null, closesAt: null };
        }

        return {
            day,
            isClosed: false,
            opensAt: dayHours.opensAt,
            closesAt: dayHours.closesAt
        };
    });
}

/**
 * Updates existing review and user favourite references to newly seeded business ObjectIds.
 * @param {Map<string, mongoose.Types.ObjectId>} oldIdToNameMap - Previous business id -> business name mapping.
 * @param {Map<string, mongoose.Types.ObjectId>} nameToNewIdMap - Business name -> newly inserted business id mapping.
 * @returns {Promise<void>}
 */
async function updateExistingUsersAndReviews(oldIdToNameMap, nameToNewIdMap) {
    const oldIdEntries = Array.from(oldIdToNameMap.entries());

    for (const [oldBusinessId, businessName] of oldIdEntries) {
        const newBusinessId = nameToNewIdMap.get(businessName);
        if (!newBusinessId) continue;

        await Review.updateMany(
            { businessId: oldBusinessId },
            { $set: { businessId: newBusinessId } }
        );
    }

    const users = await User.find({}, { favourites: 1 }).lean();

    const userUpdates = users.map((user) => {
        const updatedFavourites = (user.favourites || [])
            .map((favouriteId) => {
                const businessName = oldIdToNameMap.get(String(favouriteId));
                if (!businessName) return null;
                return nameToNewIdMap.get(businessName) || null;
            })
            .filter(Boolean);

        return {
            updateOne: {
                filter: { _id: user._id },
                update: { $set: { favourites: updatedFavourites } }
            }
        };
    });

    if (userUpdates.length > 0) {
        await User.bulkWrite(userUpdates);
    }
}

/**
 * Seeds businesses and remaps existing user/review references.
 * @returns {Promise<void>}
 */
async function seed() {
    await connectDB();

    const existingBusinesses = await Business.find({}, { _id: 1, name: 1 }).lean();
    const oldIdToNameMap = new Map(
        existingBusinesses.map((business) => [String(business._id), business.name])
    );

    await Business.deleteMany();

    const businesses = await Business.insertMany(
        BUSINESS_SEED_DATA.map((business) => ({
            ...business,
            timetable: createTimetable(business.timetable),
            imageUrl: business.bannerImageUrl || business.imageUrl
        }))
    );

    const nameToNewIdMap = new Map(
        businesses.map((business) => [business.name, business._id])
    );

    await updateExistingUsersAndReviews(oldIdToNameMap, nameToNewIdMap);

    console.log("Businesses seeded and existing users/reviews updated with new ObjectIds!");
    await mongoose.disconnect();
}

seed();