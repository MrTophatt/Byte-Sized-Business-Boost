const mongoose = require("mongoose");
const { Business } = require("./models/Business");
const { connectDB } = require("./database");

/**
 * Builds a complete 7-day timetable from partial daily opening data.
 * Days not provided are marked as closed.
 * @param {Object<string, {opensAt: string, closesAt: string}>} hoursByDay - Day-to-hours map.
 * @returns {Array<{day: string, isClosed: boolean, opensAt: (string|null), closesAt: (string|null)}>}
 */
function createTimetable(hoursByDay = {}) {
    const defaultDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ];

    return defaultDays.map((day) => {
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
 * Seeds demo businesses using the current schema shape.
 * @returns {Promise<void>}
 */
async function seed() {
    await connectDB();

    await Business.deleteMany();

    await Business.insertMany([
        {
            name: "Maple Leaf Café",
            description: "A cozy local café serving coffee and pastries.",
            categories: ["food", "cafe"],
            ownerName: "Avery Thompson",
            contactPhone: "(416) 555-0101",
            contactEmail: "hello@mapleleafcafe.ca",
            websiteUrl: "https://mapleleafcafe.ca",
            address: "120 Queen St W, Toronto, ON",
            timetable: createTimetable({
                monday: { opensAt: "07:30", closesAt: "17:00" },
                tuesday: { opensAt: "07:30", closesAt: "17:00" },
                wednesday: { opensAt: "07:30", closesAt: "17:00" },
                thursday: { opensAt: "07:30", closesAt: "17:00" },
                friday: { opensAt: "07:30", closesAt: "18:00" },
                saturday: { opensAt: "08:00", closesAt: "16:00" }
            }),
            deals: [
                {
                    title: "Student Morning Special",
                    description: "10% off for students before 11:00 AM.",
                    startDate: new Date("2026-01-01"),
                    endDate: new Date("2026-12-31"),
                    isActive: true
                }
            ]
        },
        {
            name: "Northside Fitness",
            description: "Community-focused gym with personal training.",
            categories: ["fitness", "health"],
            ownerName: "Jordan Patel",
            contactPhone: "(416) 555-0120",
            contactEmail: "team@northsidefitness.ca",
            websiteUrl: "https://northsidefitness.ca",
            address: "88 Bloor St E, Toronto, ON",
            timetable: createTimetable({
                monday: { opensAt: "05:30", closesAt: "22:00" },
                tuesday: { opensAt: "05:30", closesAt: "22:00" },
                wednesday: { opensAt: "05:30", closesAt: "22:00" },
                thursday: { opensAt: "05:30", closesAt: "22:00" },
                friday: { opensAt: "05:30", closesAt: "21:00" },
                saturday: { opensAt: "07:00", closesAt: "19:00" },
                sunday: { opensAt: "08:00", closesAt: "18:00" }
            }),
            deals: [
                {
                    title: "New Member Trial",
                    description: "Free first class for all new members.",
                    startDate: new Date("2026-01-01"),
                    endDate: new Date("2026-06-30"),
                    isActive: true
                }
            ]
        },
        {
            name: "TechNest Repairs",
            description: "Phone and laptop repair services.",
            categories: ["technology", "services"],
            ownerName: "Chris Nguyen",
            contactPhone: "(416) 555-0145",
            contactEmail: "support@technestrepairs.ca",
            websiteUrl: "https://technestrepairs.ca",
            address: "22 King St E, Toronto, ON",
            timetable: createTimetable({
                monday: { opensAt: "09:00", closesAt: "18:00" },
                tuesday: { opensAt: "09:00", closesAt: "18:00" },
                wednesday: { opensAt: "09:00", closesAt: "18:00" },
                thursday: { opensAt: "09:00", closesAt: "18:00" },
                friday: { opensAt: "09:00", closesAt: "18:00" }
            })
        },
        {
            name: "Bright Minds Tutoring",
            description: "Math, science, and coding tutoring.",
            categories: ["education", "services"],
            ownerName: "Samantha Lee",
            contactPhone: "(416) 555-0188",
            contactEmail: "info@brightmindstutoring.ca",
            websiteUrl: "https://brightmindstutoring.ca",
            address: "350 College St, Toronto, ON",
            timetable: createTimetable({
                monday: { opensAt: "15:00", closesAt: "20:00" },
                tuesday: { opensAt: "15:00", closesAt: "20:00" },
                wednesday: { opensAt: "15:00", closesAt: "20:00" },
                thursday: { opensAt: "15:00", closesAt: "20:00" },
                sunday: { opensAt: "10:00", closesAt: "14:00" }
            })
        },
        {
            name: "Downtown Boutique",
            description: "Handmade clothing and accessories.",
            categories: ["retail"],
            ownerName: "Mila Rossi",
            contactPhone: "(416) 555-0166",
            contactEmail: "shop@downtownboutique.ca",
            websiteUrl: "https://downtownboutique.ca",
            address: "541 Dundas St W, Toronto, ON",
            timetable: createTimetable({
                tuesday: { opensAt: "10:00", closesAt: "17:00" },
                wednesday: { opensAt: "10:00", closesAt: "17:00" },
                thursday: { opensAt: "10:00", closesAt: "17:00" },
                friday: { opensAt: "10:00", closesAt: "19:00" },
                saturday: { opensAt: "10:00", closesAt: "19:00" }
            })
        }
    ]);

    console.log("Businesses seeded!");
    await mongoose.disconnect();
}

seed();