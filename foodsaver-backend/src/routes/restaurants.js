// routes/restaurants.js
const express = require("express");
const { body, param } = require("express-validator");
const restaurantController = require("../controllers/restaurantController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// GET all restaurants
router.get("/", restaurantController.getRestaurants);

// GET restaurant by user ID
router.get("/user/:userId", restaurantController.getRestaurantByUser);

// POST create restaurant
router.post(
  "/",
  protect,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage("Invalid phone format"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("googleMapsLink")
      .trim()
      .notEmpty()
      .withMessage("Google Maps link is required")
      .matches(/(google\.com\/maps|goo\.gl)/)
      .withMessage("Invalid Google Maps link format"),
    body("description").optional().trim(),
  ],
  restaurantController.createRestaurant
);

// PUT update restaurant
router.put(
  "/:id",
  protect,
  [
    body("name").optional().trim().notEmpty(),
    body("phone").optional().trim(),
    body("address").optional().trim(),
    body("googleMapsLink")
      .optional()
      .trim()
      .matches(/(google\.com\/maps|goo\.gl)/),
    body("description").optional().trim(),
  ],
  restaurantController.updateRestaurant
);

// DELETE restaurant
router.delete("/:id", protect, restaurantController.deleteRestaurant);

module.exports = router;
