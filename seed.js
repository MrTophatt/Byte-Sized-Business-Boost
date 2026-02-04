const mongoose = require("mongoose");
const { Business } = require("./models/Business");
const { connectDB } = require("./database");

async function seed() {
    await connectDB()
    
    await Business.deleteMany();

    await Business.insertMany([
        {
            name: "Maple Leaf Café",
            description: "A cozy local café serving coffee and pastries.",
            categories: ["food", "cafe"],
            deals: ["10% off student discount"]
        },
        {
            name: "Northside Fitness",
            description: "Community-focused gym with personal training.",
            categories: ["fitness", "health"],
            deals: ["Free first class"]
        },
        {
            name: "TechNest Repairs",
            description: "Phone and laptop repair services.",
            categories: ["technology", "services"],
        },
        {
            name: "Bright Minds Tutoring",
            description: "Math, science, and coding tutoring.",
            categories: ["education", "services"],
        },
        {
            name: "Downtown Boutique",
            description: "Handmade clothing and accessories.",
            categories: ["retail"],
        }
    ]);

    console.log("Businesses seeded!");
    await mongoose.disconnect();
}

seed();