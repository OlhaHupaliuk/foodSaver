// routes/foodItems.js
const express = require("express");
const { body } = require("express-validator");
const foodItemController = require("../controllers/foodItemController");
const { protect, authorize } = require("../middleware/auth");
const { foodItemValidation } = require("../utils/validators");

const router = express.Router();

// GET food items by restaurant
router.get(
  "/restaurant/:restaurantId",
  foodItemController.getFoodItemsByRestaurant
);

// GET all food items
router.get("/", foodItemController.getFoodItems);

// GET single food item
router.get("/:id", foodItemController.getFoodItem);

// POST create food item
router.post(
  "/",
  protect,
  authorize("restaurant_owner", "admin"),
  foodItemValidation, // ✅ Використовуємо правильну валідацію
  foodItemController.createFoodItem
);

// PUT update food item
router.put(
  "/:id",
  protect,
  authorize("restaurant_owner", "admin"),
  [
    body("title").optional().trim(),
    body("description").optional().trim(),
    body("originalPrice").optional().isFloat({ min: 0 }),
    body("discountedPrice").optional().isFloat({ min: 0 }),
    body("quantity").optional().isInt({ min: 1 }),
    body("expiryTime").optional().isISO8601(),
    body("category").optional().trim(),
  ],
  foodItemController.updateFoodItem
);

// DELETE food item
router.delete(
  "/:id",
  protect,
  authorize("restaurant_owner", "admin"),
  foodItemController.deleteFoodItem
);

module.exports = router;
