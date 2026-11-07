const express = require("express");
const User = require("../models/User");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

function isValidId(id) {
    return /^[a-f\d]{24}$/i.test(id);
}

// All routes below require admin access
router.use(protect, adminOnly);

// Dashboard statistics
router.get("/stats", async (req, res) => {
    try {
        const [
            totalUsers,
            totalItems,
            lostItems,
            foundItems,
            totalClaims,
            pendingClaims,
            returnedItems
        ] = await Promise.all([
            User.countDocuments(),
            Item.countDocuments(),
            Item.countDocuments({ type: "Lost" }),
            Item.countDocuments({ type: "Found" }),
            Claim.countDocuments(),
            Claim.countDocuments({ status: "Pending" }),
            Item.countDocuments({ status: "Returned" })
        ]);

        res.json({
            totalUsers,
            totalItems,
            lostItems,
            foundItems,
            totalClaims,
            pendingClaims,
            returnedItems
        });
    } catch (error) {
        res.status(500).json({ message: "Could not load statistics" });
    }
});

// View all users
router.get("/users", async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({ count: users.length, users });
    } catch (error) {
        res.status(500).json({ message: "Could not retrieve users" });
    }
});

// View all claims
router.get("/claims", async (req, res) => {
    try {
        const claims = await Claim.find()
            .populate("item")
            .populate("claimedBy", "name email")
            .sort({ createdAt: -1 });

        res.json({ count: claims.length, claims });
    } catch (error) {
        res.status(500).json({ message: "Could not retrieve claims" });
    }
});

// Approve or reject a claim
router.patch("/claims/:id", async (req, res) => {
    try {
        const { status } = req.body;

        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: "Invalid claim ID" });
        }

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be Approved or Rejected"
            });
        }

        const claim = await Claim.findById(req.params.id);

        if (!claim) {
            return res.status(404).json({ message: "Claim not found" });
        }

        if (claim.status !== "Pending") {
            return res.status(400).json({
                message: "This claim has already been reviewed"
            });
        }

        const item = await Item.findById(claim.item);

        if (!item) {
            return res.status(404).json({ message: "Claimed item not found" });
        }

        if (status === "Approved") {
            if (item.status !== "Available") {
                return res.status(409).json({
                    message: "This item is no longer available"
                });
            }

            // Approve one claim and reject other pending claims
            await Claim.updateMany(
                {
                    item: item._id,
                    _id: { $ne: claim._id },
                    status: "Pending"
                },
                { $set: { status: "Rejected" } }
            );

            item.status = "Claimed";
            await item.save();
        }

        claim.status = status;
        await claim.save();

        res.json({
            message: `Claim ${status.toLowerCase()} successfully`,
            claim
        });
    } catch (error) {
        res.status(500).json({ message: "Could not review claim" });
    }
});

module.exports = router;