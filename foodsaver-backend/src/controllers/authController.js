// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validationResult } = require("express-validator");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Помилка валідації",
        errors: errors.array(),
      });
    }

    const { name, email, password, phone } = req.body;

    // Перевірка чи існує користувач
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        status: "error",
        message: "Користувач з таким email уже існує",
      });
    }

    // Створення користувача БЕЗ координат
    user = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      role: "user",
    });

    // Генерація токену
    const token = generateToken(user._id);

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          role: user.role,
          restaurant: user.restaurant,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Помилка валідації",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Валідація email та пароля
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Будь ласка введіть email та пароль",
      });
    }

    // Пошук користувача з паролем
    const user = await User.findOne({ email })
      .select("+password")
      .populate("restaurant");

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Невірний email або пароль",
      });
    }

    // Перевірка паролю
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Невірний email або пароль",
      });
    }

    const token = generateToken(user._id);

    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          photo: user.photo,
          role: user.role,
          restaurant: user.restaurant,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("restaurant");

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Помилка валідації",
        errors: errors.array(),
      });
    }

    const fieldsToUpdate = {};

    if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name;
    if (req.body.email !== undefined) fieldsToUpdate.email = req.body.email;
    if (req.body.phone !== undefined) {
      fieldsToUpdate.phone = req.body.phone || null;
    }

    // Handle photo update - allow empty string to remove, or set new photo
    if (req.body.photo !== undefined) {
      if (req.body.photo === "" || req.body.photo === null) {
        fieldsToUpdate.photo = null;
      } else if (
        typeof req.body.photo === "string" &&
        req.body.photo.length > 0
      ) {
        fieldsToUpdate.photo = req.body.photo;
      }
    }

    console.log("Updating profile with fields:", Object.keys(fieldsToUpdate));
    if (fieldsToUpdate.photo !== undefined) {
      console.log(
        "Photo field will be updated, length:",
        fieldsToUpdate.photo ? fieldsToUpdate.photo.length : 0
      );
    }

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).populate("restaurant");

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Користувача не знайдено",
      });
    }

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    next(error);
  }
};
