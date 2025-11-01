// models/FoodItem.js
const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Other",
    },
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
  },
  { timestamps: true }
);

foodItemSchema.methods.checkAvailability = function () {
  if (new Date() > this.expiryTime || this.quantity <= 0) {
    this.isAvailable = false;
  }
};

foodItemSchema.pre("save", function (next) {
  this.checkAvailability();
  next();
});

foodItemSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("FoodItem", foodItemSchema);
