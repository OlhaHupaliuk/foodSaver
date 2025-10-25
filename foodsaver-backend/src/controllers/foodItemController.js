const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const { validationResult } = require("express-validator");

// @desc    Get all food items
// @route   GET /api/food-items
// @access  Public
exports.getFoodItems = async (req, res, next) => {
  try {
    const {
      restaurant,
      category,
      maxPrice,
      minDiscount,
      longitude,
      latitude,
      maxDistance,
    } = req.query;

    // Базовий запит - тільки доступні товари
    let query = { isAvailable: true, quantity: { $gt: 0 } };

    // Фільтри
    if (restaurant) query.restaurant = restaurant;
    if (category) query.category = category;
    if (maxPrice) query.discountedPrice = { $lte: parseFloat(maxPrice) };
    if (minDiscount) query.discountPercentage = { $gte: parseInt(minDiscount) };

    let foodItems = await FoodItem.find(query)
      .populate("restaurant", "name location address phone")
      .sort({ createdAt: -1 });

    // Геолокаційний фільтр (якщо потрібно)
    if (longitude && latitude) {
      const distance = maxDistance || 5000;
      const nearbyRestaurants = await Restaurant.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseInt(distance),
          },
        },
      }).select("_id");

      const restaurantIds = nearbyRestaurants.map((r) => r._id);
      foodItems = foodItems.filter((item) =>
        restaurantIds.some((id) => id.equals(item.restaurant._id))
      );
    }

    // Перевірка термінів придатності та оновлення статусу
    for (let item of foodItems) {
      item.checkAvailability();
      if (!item.isAvailable) {
        await item.save();
      }
    }

    // Фільтруємо тільки доступні після перевірки
    foodItems = foodItems.filter((item) => item.isAvailable);

    res.json({
      status: "success",
      results: foodItems.length,
      data: { foodItems },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single food item
// @route   GET /api/food-items/:id
// @access  Public
exports.getFoodItem = async (req, res, next) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate(
      "restaurant",
      "name location address phone openingHours"
    );

    if (!foodItem) {
      return res.status(404).json({
        status: "error",
        message: "Food item not found",
      });
    }

    // Перевірка доступності
    foodItem.checkAvailability();
    if (!foodItem.isAvailable) {
      await foodItem.save();
    }

    res.json({
      status: "success",
      data: { foodItem },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create food item
// @route   POST /api/food-items
// @access  Private (restaurant owner/admin)
exports.createFoodItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    // Перевіряємо що користувач є власником ресторану
    const restaurant = await Restaurant.findById(req.body.restaurant);

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
        message: "Not authorized to add items to this restaurant",
      });
    }

    // Валідація цін
    if (req.body.discountedPrice >= req.body.originalPrice) {
      return res.status(400).json({
        status: "error",
        message: "Discounted price must be less than original price",
      });
    }

    const foodItem = await FoodItem.create(req.body);

    await foodItem.populate("restaurant", "name location address");

    res.status(201).json({
      status: "success",
      data: { foodItem },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update food item
// @route   PUT /api/food-items/:id
// @access  Private (restaurant owner/admin)
exports.updateFoodItem = async (req, res, next) => {
  try {
    let foodItem = await FoodItem.findById(req.params.id).populate(
      "restaurant"
    );

    if (!foodItem) {
      return res.status(404).json({
        status: "error",
        message: "Food item not found",
      });
    }

    // Перевірка прав доступу
    if (
      foodItem.restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this food item",
      });
    }

    // Валідація цін при оновленні
    const originalPrice = req.body.originalPrice || foodItem.originalPrice;
    const discountedPrice =
      req.body.discountedPrice || foodItem.discountedPrice;

    if (discountedPrice >= originalPrice) {
      return res.status(400).json({
        status: "error",
        message: "Discounted price must be less than original price",
      });
    }

    foodItem = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("restaurant", "name location address");

    res.json({
      status: "success",
      data: { foodItem },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete food item
// @route   DELETE /api/food-items/:id
// @access  Private (restaurant owner/admin)
exports.deleteFoodItem = async (req, res, next) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id).populate(
      "restaurant"
    );

    if (!foodItem) {
      return res.status(404).json({
        status: "error",
        message: "Food item not found",
      });
    }

    // Перевірка прав доступу
    if (
      foodItem.restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this food item",
      });
    }

    await foodItem.deleteOne();

    res.json({
      status: "success",
      message: "Food item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get food items by restaurant
// @route   GET /api/food-items/restaurant/:restaurantId
// @access  Public
exports.getFoodItemsByRestaurant = async (req, res, next) => {
  try {
    const foodItems = await FoodItem.find({
      restaurant: req.params.restaurantId,
      isAvailable: true,
      quantity: { $gt: 0 },
    }).populate("restaurant", "name address");

    res.json({
      status: "success",
      results: foodItems.length,
      data: { foodItems },
    });
  } catch (error) {
    next(error);
  }
};
