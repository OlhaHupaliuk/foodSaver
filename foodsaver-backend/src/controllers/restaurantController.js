// controllers/restaurantController.js
const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const {
  extractCoordinatesFromMapsLink,
  geocodeAddress,
} = require("../utils/geolocation");

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res, next) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    let restaurants;

    if (longitude && latitude) {
      const distance = maxDistance || 5000;
      restaurants = await Restaurant.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseInt(distance),
          },
        },
        isActive: true,
      }).populate("owner", "name email phone");
    } else {
      restaurants = await Restaurant.find({ isActive: true }).populate(
        "owner",
        "name email phone"
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

// @desc    Get restaurant by user
// @route   GET /api/restaurants/user/:userId
// @access  Public
exports.getRestaurantByUser = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.params.userId,
    }).populate("owner", "name email phone");

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

// @desc    Create restaurant (перетворити користувача на власника ресторану)
// @route   POST /api/restaurants
// @access  Private
exports.createRestaurant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Помилка валідації",
        errors: errors.array(),
      });
    }

    // Перевіряємо чи користувач вже має ресторан
    const existingRestaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (existingRestaurant) {
      return res.status(400).json({
        status: "error",
        message: "У вас вже є ресторан",
      });
    }

    let coordinates;

    // Спробуємо витягнути координати з Google Maps посилання
    if (req.body.googleMapsLink) {
      coordinates = extractCoordinatesFromMapsLink(req.body.googleMapsLink);
    }

    // Якщо не вдалося витягнути з посилання, геокодуємо адресу
    if (!coordinates && req.body.address) {
      coordinates = await geocodeAddress(req.body.address);
    }

    // Якщо все ще немає координат, використовуємо координати користувача або за замовчуванням
    if (!coordinates) {
      coordinates = req.body.coordinates || [30.5234, 50.4501]; // За замовчуванням Київ
    }

    const restaurantData = {
      name: req.body.name,
      owner: req.user._id,
      phone: req.body.phone,
      address: req.body.address,
      googleMapsLink: req.body.googleMapsLink,
      description: req.body.description || "",
      location: {
        type: "Point",
        coordinates: coordinates, // [longitude, latitude]
      },
    };

    const restaurant = await Restaurant.create(restaurantData);

    // Оновлюємо користувача
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        restaurant: restaurant._id,
        role: "restaurant_owner",
      },
      { new: true }
    ).populate("restaurant");

    await restaurant.populate("owner", "name email phone");

    res.status(201).json({
      status: "success",
      message: "Ресторан успішно створено",
      data: { restaurant, user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private
exports.updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found",
      });
    }

    // Перевірка прав доступу
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this restaurant",
      });
    }

    // Якщо оновлюємо посилання або адресу, перекалькулюємо координати
    if (req.body.googleMapsLink || req.body.address) {
      let coordinates;

      if (req.body.googleMapsLink) {
        coordinates = extractCoordinatesFromMapsLink(req.body.googleMapsLink);
      }

      if (!coordinates && req.body.address) {
        coordinates = await geocodeAddress(req.body.address);
      }

      if (coordinates) {
        req.body.location = {
          type: "Point",
          coordinates: coordinates,
        };
      }
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("owner", "name email phone");

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
// @access  Private
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: "error",
        message: "Restaurant not found",
      });
    }

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

    // Оновлюємо користувача
    await User.findByIdAndUpdate(req.user._id, {
      restaurant: null,
      role: "user",
    });

    res.json({
      status: "success",
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
