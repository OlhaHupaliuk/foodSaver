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
    const foodItemId = req.params.foodItemId;

    // Validate foodItemId
    if (!foodItemId || foodItemId === "undefined" || foodItemId === "null") {
      return res.status(400).json({
        status: "error",
        message: "Invalid food item ID",
      });
    }

    const reviews = await Review.find({
      foodItem: foodItemId,
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

// @desc    Get reviews for an order
// @route   GET /api/reviews/order/:orderId
// @access  Private
exports.getOrderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      order: req.params.orderId,
    })
      .populate("user", "name")
      .populate("foodItem", "title")
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
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

    let { restaurant, foodItem, rating, comment, order } = req.body;

    // Clean up undefined values (they come as string "undefined" from JSON)
    if (
      foodItem === "undefined" ||
      foodItem === undefined ||
      foodItem === null
    ) {
      foodItem = null;
    }
    if (
      restaurant === "undefined" ||
      restaurant === undefined ||
      restaurant === null
    ) {
      restaurant = null;
    }
    if (order === "undefined" || order === undefined || order === null) {
      order = null;
    }

    // If order is provided, extract foodItem from it first
    if (order) {
      // Verify the order belongs to the user
      const orderDoc = await Order.findById(order).select("user status items");
      if (!orderDoc) {
        return res.status(404).json({
          status: "error",
          message: "Order not found",
        });
      }

      // Get user IDs as strings for comparison
      // Handle both populated and non-populated user field
      let orderUserId;
      if (
        orderDoc.user &&
        typeof orderDoc.user === "object" &&
        orderDoc.user._id
      ) {
        // User is populated
        orderUserId = orderDoc.user._id.toString();
      } else {
        // User is ObjectId
        orderUserId = orderDoc.user.toString();
      }

      const currentUserId = req.user._id.toString();

      if (orderUserId !== currentUserId) {
        console.log(
          "Authorization failed - Order user ID:",
          orderUserId,
          "Current user ID:",
          currentUserId
        );
        return res.status(403).json({
          status: "error",
          message: "Not authorized to review this order",
        });
      }

      // Verify order is completed
      if (orderDoc.status !== "completed") {
        return res.status(400).json({
          status: "error",
          message: "Can only review completed orders",
        });
      }

      // If foodItem is not provided, get it from the order
      if (!foodItem && orderDoc.items && orderDoc.items.length > 0) {
        const firstOrderItem = orderDoc.items[0];
        foodItem =
          firstOrderItem.foodItem?.toString() || firstOrderItem.foodItem;
        req.body.foodItem = foodItem;
      }

      // Check if user already reviewed this order
      const existingOrderReview = await Review.findOne({
        user: req.user._id,
        order: order,
      });

      if (existingOrderReview) {
        return res.status(400).json({
          status: "error",
          message: "You have already reviewed this order",
        });
      }
    }

    // Validate that either restaurant or foodItem is provided (after extracting from order if needed)
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
    } else {
      // If no order, check if user already reviewed this restaurant/item (one review per user per restaurant/item)
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
