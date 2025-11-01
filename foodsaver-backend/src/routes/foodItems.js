// routes/foodItems.js
const express = require("express");
const { body } = require("express-validator");
const foodItemController = require("../controllers/foodItemController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// GET all food items (публічний)
router.get("/", foodItemController.getFoodItems);

// GET food items by restaurant (публічний)
router.get(
  "/restaurant/:restaurantId",
  foodItemController.getFoodItemsByRestaurant
);

// GET single food item (публічний) - ПОВИНЕН БУТИ ПІСЛЯ більш специфічних маршрутів
router.get("/:id", foodItemController.getFoodItem);

// POST create food item (тільки restaurant_owner та admin)
router.post(
  "/",
  protect,
  authorize("restaurant_owner", "admin"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("originalPrice")
      .isFloat({ min: 0 })
      .withMessage("Original price must be a positive number"),
    body("discountedPrice")
      .isFloat({ min: 0 })
      .withMessage("Discounted price must be a positive number"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
    body("expiryTime")
      .isISO8601()
      .withMessage("Expiry time must be a valid ISO8601 date"),
    body("category").optional().trim(),
  ],
  foodItemController.createFoodItem
);

// PUT update food item (тільки restaurant_owner та admin)
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

// DELETE food item (тільки restaurant_owner та admin)
router.delete(
  "/:id",
  protect,
  authorize("restaurant_owner", "admin"),
  foodItemController.deleteFoodItem
);

module.exports = router;
