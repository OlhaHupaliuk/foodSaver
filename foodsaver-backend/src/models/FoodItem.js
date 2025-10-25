const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  name: {
    type: String,
    required: [true, "Please provide food item name"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  originalPrice: {
    type: Number,
    required: [true, "Please provide original price"],
    min: 0,
  },
  discountedPrice: {
    type: Number,
    required: [true, "Please provide discounted price"],
    min: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ["meal", "bakery", "dessert", "beverage", "other"],
    default: "meal",
  },
  images: [String],
  allergens: [String],
  expiryTime: {
    type: Date,
    required: true,
  },
  pickupTime: {
    start: Date,
    end: Date,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Автоматичний розрахунок знижки
foodItemSchema.pre("save", function (next) {
  if (this.originalPrice && this.discountedPrice) {
    this.discountPercentage = Math.round(
      ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100
    );
  }
  next();
});

// Перевірка доступності на основі expiryTime
foodItemSchema.methods.checkAvailability = function () {
  if (new Date() > this.expiryTime || this.quantity <= 0) {
    this.isAvailable = false;
  }
  return this.isAvailable;
};

module.exports = mongoose.model("FoodItem", foodItemSchema);
