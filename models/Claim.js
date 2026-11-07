
const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },
        claimedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

claimSchema.index(
    { item: 1, claimedBy: 1 },
    { unique: true }
);

const Claim =
    mongoose.models.Claim ||
    mongoose.model("Claim", claimSchema);

module.exports = Claim;
