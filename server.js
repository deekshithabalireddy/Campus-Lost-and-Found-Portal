
require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");
const Item = require("./models/Item");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/claims", require("./routes/claims"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api", (req, res) => {
    res.json({
        message: "Campus Lost and Found Portal API is running!"
    });
});

// Create initial admin account
async function createAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "ADMIN_EMAIL and ADMIN_PASSWORD are required in .env"
        );
    }

    if (password.length < 12) {
        throw new Error(
            "Admin password must be at least 12 characters long"
        );
    }

    const normalizedEmail = email.trim().toLowerCase();

    let admin = await User.findOne({
        email: normalizedEmail
    });

    if (!admin) {
        const hashedPassword = await bcrypt.hash(password, 12);

        admin = await User.create({
            name: "Portal Administrator",
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Initial admin account created.");
    } else if (admin.role !== "admin") {
        throw new Error(
            "ADMIN_EMAIL belongs to a non-admin account. Use another email."
        );
    }
}

// Add demo items if the collection is empty
async function seedItems() {
    if (await Item.countDocuments() > 0) {
        return;
    }

    const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();

    const admin = await User.findOne({
        email: adminEmail
    });

    if (!admin) {
        throw new Error("Admin account not found for demo items.");
    }

    const sampleItems = [
        ["Blue Water Bottle", "Other", "Blue reusable bottle", "University Library", "Found"],
        ["Black Wallet", "Accessories", "Black wallet with cards inside", "Cafeteria", "Found"],
        ["Student ID Card", "Documents", "Student identity card", "Main Block", "Found"],
        ["Wireless Earbuds", "Electronics", "White wireless earbuds case", "Computer Lab", "Lost"],
        ["Notebook", "Books", "Green notebook with class notes", "Classroom 204", "Lost"],
        ["Silver Keys", "Other", "Small keychain with two keys", "Parking Area", "Found"],
        ["Laptop Charger", "Electronics", "Laptop charging adapter", "Library", "Lost"],
        ["Black Backpack", "Bags", "Backpack with books", "Auditorium", "Lost"],
        ["Umbrella", "Other", "Foldable navy blue umbrella", "Hostel Entrance", "Found"],
        ["Wrist Watch", "Accessories", "Round dial wrist watch", "Sports Ground", "Lost"]
    ];

    const today = new Date();

    await Item.insertMany(
        sampleItems.map((item, index) => ({
            name: item[0],
            category: item[1],
            description: item[2],
            location: item[3],
            type: item[4],
            date: new Date(today.getTime() - index * 86400000),
            status: "Available",
            reportedBy: admin._id
        }))
    );

    console.log("10 sample items added.");
}

// Start the application
async function startServer() {
    if (
        !process.env.JWT_SECRET ||
        process.env.JWT_SECRET.length < 32
    ) {
        throw new Error(
            "JWT_SECRET must be at least 32 characters long"
        );
    }

    await connectDB();
    await createAdmin();
    await seedItems();

    const port = process.env.PORT || 3000;

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer().catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
});
