const mongoose = require("mongoose");
const foodItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: String,
  originalPrice: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  expiryTime: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

foodItemSchema.methods.checkAvailability = function () {
  if (new Date() > this.expiryTime || this.quantity <= 0) {
    this.isAvailable = false;
  }
};
