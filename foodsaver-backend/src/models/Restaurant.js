// models/Restaurant.js
const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  googleMapsLink: {
    type: String,
    required: true,
  },
  description: String,
  // Координати для геопошуку
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Геоіндекс для пошуку за координатами
restaurantSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Restaurant", restaurantSchema);
