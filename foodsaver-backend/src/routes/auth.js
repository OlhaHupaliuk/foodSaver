// routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// POST register
router.post(
  "/register",
  [
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
  ],
  authController.register
);

// POST login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

// GET current user
router.get("/me", protect, authController.getMe);

// PUT update profile
router.put(
  "/me",
  protect,
  [
    body("name").optional().trim().isLength({ min: 2 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("phone").optional().trim(),
    body("photo")
      .optional()
      .custom((value) => {
        if (
          value === null ||
          value === undefined ||
          value === "" ||
          typeof value === "string"
        ) {
          return true;
        }
        throw new Error("Photo must be a string");
      }),
  ],
  authController.updateProfile
);

module.exports = router;
