const { body, param, query } = require("express-validator");

// Валідація реєстрації
exports.registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["user", "restaurant", "admin"])
    .withMessage("Invalid role"),
];

// Валідація логіну
exports.loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Валідація ресторану
exports.restaurantValidation = [
  body("name").trim().notEmpty().withMessage("Restaurant name is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("location.coordinates")
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be [longitude, latitude]"),
];

// Валідація food item
exports.foodItemValidation = [
  body("name").trim().notEmpty().withMessage("Food item name is required"),
  body("originalPrice")
    .isFloat({ min: 0 })
    .withMessage("Original price must be a positive number"),
  body("discountedPrice")
    .isFloat({ min: 0 })
    .withMessage("Discounted price must be a positive number"),
  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a positive integer"),
  body("expiryTime").isISO8601().withMessage("Valid expiry time is required"),
];

// Валідація замовлення
exports.orderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.foodItem").notEmpty().withMessage("Food item ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("pickupTime").isISO8601().withMessage("Valid pickup time is required"),
];
