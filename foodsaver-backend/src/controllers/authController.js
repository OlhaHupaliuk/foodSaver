// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @desc    Register user (простий користувач)
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
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        status: "error",
        message: "Користувач з таким email уже існує",
      });
    }

    // Хешування пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Створення користувача
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "user", // За замовчуванням звичайний користувач
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

    // Пошук користувача з паролем
    const user = await User.findOne({ email })
      .select("+password")
      .populate("restaurant");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        status: "error",
        message: "Невірний email або пароль",
      });
    }

    const token = generateToken(user._id);

    // Видаляємо пароль перед відправкою
    user.password = undefined;

    res.json({
      status: "success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
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
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    };

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).populate("restaurant");

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
