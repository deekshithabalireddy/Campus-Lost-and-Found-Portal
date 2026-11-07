
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    location: {
        type: String,
        required: true,
        trim: true
    },

    date: {
        type: Date,
        required: true
    },

    type: {
        type: String,
        enum: ["Lost", "Found"],
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["Available", "Claimed", "Returned"],
        default: "Available"
    },

    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
