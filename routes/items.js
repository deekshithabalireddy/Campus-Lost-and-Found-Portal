const express = require("express");
const Item = require("../models/Item");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

const validTypes = ["Lost", "Found"];
const validStatuses = ["Available", "Claimed", "Returned"];

function isValidId(id) {
    return /^[a-f\d]{24}$/i.test(id);
}

// Get items + search + filters + date sorting
router.get("/", async (req, res) => {
    try {
        const { search, category, location, type, sort } = req.query;
        const filter = {};

        if (search) {
            const safeSearch = search.trim().slice(0, 100);
            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } }
            ];
        }

        if (category) filter.category = category;
        if (location) {
            filter.location = { $regex: location.trim(), $options: "i" };
        }

        if (type) {
            if (!validTypes.includes(type)) {
                return res.status(400).json({ message: "Invalid item type" });
            }
            filter.type = type;
        }

        const sortOrder = sort === "oldest" ? 1 : -1;

        const items = await Item.find(filter)
            .populate("reportedBy", "name")
            .sort({ date: sortOrder })
            .limit(100);

        res.json({ count: items.length, items });
    } catch (error) {
        res.status(500).json({ message: "Could not retrieve items" });
    }
});

// Get one item
router.get("/:id", async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Item.findById(req.params.id)
            .populate("reportedBy", "name");

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.json({ item });
    } catch (error) {
        res.status(500).json({ message: "Could not retrieve item" });
    }
});

// Create a lost/found report
router.post("/", protect, async (req, res) => {
    try {
        const { name, category, description, location, date, type, image } = req.body;

        if (!name || !category || !description || !location || !date || !type) {
            return res.status(400).json({
                message: "Please fill in all required fields"
            });
        }

        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: "Type must be Lost or Found" });
        }

        if (Number.isNaN(Date.parse(date))) {
            return res.status(400).json({ message: "Invalid date" });
        }

        const item = await Item.create({
            name: name.trim(),
            category: category.trim(),
            description: description.trim(),
            location: location.trim(),
            date,
            type,
            image: image || "",
            reportedBy: req.user._id
        });

        res.status(201).json({
            message: "Item reported successfully",
            item
        });
    } catch (error) {
        res.status(500).json({ message: "Could not create report" });
    }
});

// Update own item; admin can update any item
router.put("/:id", protect, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        const isOwner = item.reportedBy.toString() === req.user._id.toString();

        if (!isOwner && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not allowed to edit this item" });
        }

        const allowed = ["name", "category", "description", "location", "date", "type", "image"];

        for (const key of allowed) {
            if (req.body[key] !== undefined) item[key] = req.body[key];
        }

        if (req.body.type && !validTypes.includes(req.body.type)) {
            return res.status(400).json({ message: "Invalid item type" });
        }

        if (req.body.date && Number.isNaN(Date.parse(req.body.date))) {
            return res.status(400).json({ message: "Invalid date" });
        }

        await item.save();
        res.json({ message: "Item updated successfully", item });
    } catch (error) {
        res.status(500).json({ message: "Could not update item" });
    }
});

// Delete own item; admin can delete any item
router.delete("/:id", protect, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        const isOwner = item.reportedBy.toString() === req.user._id.toString();

        if (!isOwner && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not allowed to delete this item" });
        }

        await Item.findByIdAndDelete(item._id);
        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Could not delete item" });
    }
});

// Admin-only status update
router.patch("/:id/status", protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;

        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid item ID" });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid item status" });
        }

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.json({ message: "Item status updated", item });
    } catch (error) {
        res.status(500).json({ message: "Could not update status" });
    }
});

module.exports = router;