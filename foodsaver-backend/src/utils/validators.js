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
  body("phone").optional().trim(),
];

// Валідація логіну
exports.loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Валідація ресторану
exports.restaurantValidation = [
  body("name").trim().notEmpty().withMessage("Restaurant name is required"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage("Invalid phone format"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("googleMapsLink")
    .trim()
    .notEmpty()
    .withMessage("Google Maps link is required"),
];

// Валідація food item - ПРАВИЛЬНІ імена!
exports.foodItemValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("originalPrice")
    .isFloat({ min: 0 })
    .withMessage("Original price must be a positive number"),
  body("discountedPrice")
    .isFloat({ min: 0 })
    .withMessage("Discounted price must be a positive number"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("expiryTime").isISO8601().withMessage("Valid expiry time is required"),
  body("category").optional().trim(),
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
