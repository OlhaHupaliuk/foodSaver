const express = require("express");
const router = express.Router();
const {
  getFoodItems,
  getFoodItem,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getFoodItemsByRestaurant,
} = require("../controllers/foodItemController");
const { protect, authorize } = require("../middleware/auth");
const { foodItemValidation } = require("../utils/validators");

router.get("/", getFoodItems);
router.get("/by-restaurant/:restaurantId", getFoodItemsByRestaurant);
router.get("/:id", getFoodItem);

// захищені ендпоінти

//створення позиції
router.post(
  "/",
  protect,
  authorize("restaurant", "admin"),
  foodItemValidation,
  createFoodItem
);
//
router.put("/:id", protect, authorize("restaurant", "admin"), updateFoodItem);

//видалення
router.delete(
  "/:id",
  protect,
  authorize("restaurant", "admin"),
  deleteFoodItem
);

module.exports = router;
