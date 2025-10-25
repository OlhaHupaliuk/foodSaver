const express = require("express");
const router = express.Router();
const {
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require("../controllers/restaurantController");
const { protect, authorize } = require("../middleware/auth");
const { restaurantValidation } = require("../utils/validators");

router.get("/", getRestaurants);
router.get("/:id", getRestaurant);

// захищені ендпоінти

router.post(
  "/",
  protect,
  authorize("restaurant", "admin"),
  restaurantValidation,
  createRestaurant
);

router.put("/:id", protect, authorize("restaurant", "admin"), updateRestaurant);

router.delete(
  "/:id",
  protect,
  authorize("restaurant", "admin"),
  deleteRestaurant
);

module.exports = router;
