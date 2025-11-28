// models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: false, // Required if foodItem is not provided
    },
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: false, // Required if restaurant is not provided
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false, // Optional: link review to specific order
    },
  },
  { timestamps: true }
);

// Validation: either restaurant or foodItem must be provided
reviewSchema.pre("validate", function (next) {
  if (!this.restaurant && !this.foodItem) {
    next(new Error("Either restaurant or foodItem must be provided"));
  } else {
    next();
  }
});

// Indexes for efficient queries
reviewSchema.index({ restaurant: 1, createdAt: -1 });
reviewSchema.index({ foodItem: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

reviewSchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Review", reviewSchema);

