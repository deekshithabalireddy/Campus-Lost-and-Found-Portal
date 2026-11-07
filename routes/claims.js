
const express = require("express");
const mongoose = require("mongoose");

const Claim = require("../models/Claim");
const Item = require("../models/Item");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Check whether MongoDB ID is valid
function isValidId(id) {
    return (
        typeof id === "string" &&
        mongoose.Types.ObjectId.isValid(id) &&
        /^[a-f\d]{24}$/i.test(id)
    );
}

// POST: Submit a claim
router.post("/", protect, async (req, res) => {
    try {
        const { itemId, message } = req.body || {};

        // Validate request body
        if (
            !itemId ||
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                message: "Item ID and claim message are required"
            });
        }

        // Validate item ID
        if (!isValidId(itemId)) {
            return res.status(400).json({
                message: "Invalid item ID"
            });
        }

        // Find item in database
        const item = await Item.findById(itemId);

        if (!item) {
            return res.status(404).json({
                message: "Item not found"
            });
        }

        // Do not allow users to claim their own listing
        if (
            item.reportedBy &&
            item.reportedBy.toString() ===
                req.user._id.toString()
        ) {
            return res.status(400).json({
                message: "You cannot claim your own listing"
            });
        }

        // Only available items can be claimed
        if (item.status !== "Available") {
            return res.status(400).json({
                message: "This item is no longer available for claims",
                actualStatus: item.status
            });
        }

        // Check for an existing claim
        const existingClaim = await Claim.findOne({
            item: item._id,
            claimedBy: req.user._id
        });

        if (existingClaim) {
            return res.status(409).json({
                message: "You have already submitted a claim for this item"
            });
        }

        // Create claim
        const claim = await Claim.create({
            item: item._id,
            claimedBy: req.user._id,
            message: message.trim()
        });

        return res.status(201).json({
            message: "Claim submitted successfully",
            claim
        });

    } catch (error) {
        console.error("CLAIM SUBMISSION ERROR:", error);

        // Handle duplicate database index errors
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Claim already exists"
            });
        }

        // Actual error is returned temporarily for local debugging
        return res.status(500).json({
            message: "Could not submit claim",
            error: error.message
        });
    }
});

// GET: View claims submitted by the logged-in user
router.get("/my", protect, async (req, res) => {
    try {
        const claims = await Claim.find({
            claimedBy: req.user._id
        })
            .populate("item")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: claims.length,
            claims
        });

    } catch (error) {
        console.error("GET MY CLAIMS ERROR:", error);

        return res.status(500).json({
            message: "Could not retrieve your claims"
        });
    }
});

module.exports = router;
