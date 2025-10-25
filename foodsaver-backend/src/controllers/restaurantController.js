const Restaurant = require("../models/Restaurant");
const { validationResult } = require("express-validator");
const { findNearby } = require("../utils/geolocation");

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    let restaurants;

    // Якщо передані координати - шукаємо поблизу
    if (longitude && latitude) {
      const distance = maxDistance || 5000; // 5км за замовчуванням
      restaurants = await findNearby(
        Restaurant,
        parseFloat(longitude),
        parseFloat(latitude),
        parseInt(distance)
      ).populate("owner", "name email");
    } else {
      restaurants = await Restaurant.find({ isActive: true }).populate(
        "owner",
        "name email"
      );
    }

    res.json({
      status: "success",
      results: restaurants.length,
      data: { restaurants },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      "owner",
      "name email phone"
    );

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found",
      });
    }

    res.json({
      status: "success",
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (restaurant/admin)
exports.createRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    // Додаємо owner з токену
    req.body.owner = req.user._id;

    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      status: "success",
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (owner/admin)
exports.updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found",
      });
    }

    // Перевірка ownership
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this restaurant",
      });
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      status: "success",
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (owner/admin)
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found",
      });
    }

    // Перевірка ownership
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this restaurant",
      });
    }

    await restaurant.deleteOne();

    res.json({
      status: "success",
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
