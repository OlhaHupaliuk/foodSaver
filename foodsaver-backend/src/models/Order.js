const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  items: [
    {
      foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodItem",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
      },
      originalPrice: {
        type: Number,
        required: false, // Store original price for statistics
      },
      discountedPrice: {
        type: Number,
        required: false, // Store discounted price for statistics
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  totalDiscount: {
    type: Number,
    default: 0, // Total discount amount for statistics
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "ready", "completed", "cancelled"],
    default: "pending",
  },
  pickupTime: {
    type: Date,
    required: true,
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Оновлення updatedAt при кожній зміні
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

orderSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Order", orderSchema);
