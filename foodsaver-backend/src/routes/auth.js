const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerValidation, loginValidation } = require("../utils/validators");

router.get("/", register);

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);

// захищені ендпоінти
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfile);

module.exports = router;
