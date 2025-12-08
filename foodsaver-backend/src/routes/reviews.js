// routes/reviews.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const { body } = require("express-validator");

// Validation middleware
const reviewValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Comment must be less than 1000 characters"),
];

// GET reviews for restaurant
router.get("/restaurant/:restaurantId", reviewController.getRestaurantReviews);

// GET reviews for food item
router.get("/food-item/:foodItemId", reviewController.getFoodItemReviews);

// GET reviews for order
router.get("/order/:orderId", protect, reviewController.getOrderReviews);

// POST create review
router.post("/", protect, reviewValidation, reviewController.createReview);

// PUT update review
router.put("/:id", protect, reviewValidation, reviewController.updateReview);

// DELETE review
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
