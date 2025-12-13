// models/FoodItem.js
const mongoose = require("mongoose");

const DEFAULT_LOCATION = [24.0297, 49.8397]; // [longitude, latitude] for Lviv

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
    imageBase64: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        default: DEFAULT_LOCATION,
        validate: {
          validator: (value) =>
            Array.isArray(value) &&
            value.length === 2 &&
            value.every((num) => typeof num === "number"),
          message:
            "Location coordinates must be an array [longitude, latitude]",
        },
      },
    },
  },
  { timestamps: true }
);

// Index for geospatial queries
foodItemSchema.index({ location: "2dsphere" });

// Defer index creation until we clean up existing records
foodItemSchema.set("autoIndex", false);

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
