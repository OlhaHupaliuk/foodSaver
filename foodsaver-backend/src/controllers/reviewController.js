// controllers/reviewController.js
const Review = require("../models/Review");
const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Order = require("../models/Order");
const { validationResult } = require("express-validator");

// @desc    Get reviews for a restaurant
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      restaurant: req.params.restaurantId,
    })
      .populate("user", "name")
      .populate("foodItem", "title")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
        averageRating: parseFloat(avgRating.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a food item
// @route   GET /api/reviews/food-item/:foodItemId
// @access  Public
exports.getFoodItemReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      foodItem: req.params.foodItemId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
        averageRating: parseFloat(avgRating.toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Помилка валідації",
        errors: errors.array(),
      });
    }

    const { restaurant, foodItem, rating, comment, order } = req.body;

    // Validate that either restaurant or foodItem is provided
    if (!restaurant && !foodItem) {
      return res.status(400).json({
        status: "error",
        message: "Either restaurant or foodItem must be provided",
      });
    }

    // Check if restaurant/foodItem exists
    if (restaurant) {
      const restaurantExists = await Restaurant.findById(restaurant);
      if (!restaurantExists) {
        return res.status(404).json({
          status: "error",
          message: "Restaurant not found",
        });
      }
    }

    if (foodItem) {
      const foodItemExists = await FoodItem.findById(foodItem);
      if (!foodItemExists) {
        return res.status(404).json({
          status: "error",
          message: "Food item not found",
        });
      }
      // If foodItem is provided, also set restaurant from foodItem
      if (!restaurant) {
        req.body.restaurant = foodItemExists.restaurant;
      }
    }

    // Check if user already reviewed (optional: one review per user per restaurant/item)
    const existingReview = await Review.findOne({
      user: req.user._id,
      ...(restaurant ? { restaurant } : { foodItem }),
    });

    if (existingReview) {
      return res.status(400).json({
        status: "error",
        message: "You have already reviewed this restaurant/item",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      restaurant: req.body.restaurant,
      foodItem: req.body.foodItem,
      rating,
      comment,
      order: order || null,
    });

    await review.populate("user", "name");
    await review.populate("restaurant", "name");
    if (review.foodItem) {
      await review.populate("foodItem", "title");
    }

    res.status(201).json({
      status: "success",
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this review",
      });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("user", "name")
      .populate("restaurant", "name")
      .populate("foodItem", "title");

    res.json({
      status: "success",
      data: { review: updatedReview },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: "error",
        message: "Review not found",
      });
    }

    // Check if user owns the review or is admin
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this review",
      });
    }

    await review.deleteOne();

    res.json({
      status: "success",
      message: "Review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

