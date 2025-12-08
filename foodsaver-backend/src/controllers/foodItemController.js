// controllers/foodItemController.js
const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const Review = require("../models/Review");
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

    let query = { isAvailable: true, quantity: { $gt: 0 } };

    if (restaurant) query.restaurant = restaurant;
    if (category) query.category = category;
    if (maxPrice) query.discountedPrice = { $lte: parseFloat(maxPrice) };

    let foodItems = await FoodItem.find(query)
      .populate({
        path: "restaurant",
        select: "name address phone googleMapsLink location",
      })
      .sort({ createdAt: -1 });

    // Геолокаційний фільтр
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

    // Перевірка термінів придатності
    for (let item of foodItems) {
      item.checkAvailability();
      if (!item.isAvailable) {
        await item.save();
      }
    }

    foodItems = foodItems.filter((item) => item.isAvailable);

    // Calculate average ratings for each food item
    const foodItemsWithRatings = await Promise.all(
      foodItems.map(async (item) => {
        const reviews = await Review.find({ foodItem: item._id });
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null;

        const itemObj = item.toObject();
        itemObj.averageRating = avgRating
          ? parseFloat(avgRating.toFixed(2))
          : null;
        // Ensure imageBase64 is included if it exists
        if (item.imageBase64) {
          itemObj.imageBase64 = item.imageBase64;
        }
        // Ensure restaurant ID is always available (even when populated)
        if (itemObj.restaurant && typeof itemObj.restaurant === "object") {
          // If restaurant is populated, ensure we have the ID
          if (!itemObj.restaurant.id && itemObj.restaurant._id) {
            itemObj.restaurant.id = itemObj.restaurant._id.toString();
          }
        }
        return itemObj;
      })
    );

    res.json({
      status: "success",
      results: foodItemsWithRatings.length,
      data: { items: foodItemsWithRatings },
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
      "name address phone googleMapsLink"
    );

    if (!foodItem) {
      return res.status(404).json({
        status: "error",
        message: "Food item not found",
      });
    }

    foodItem.checkAvailability();
    if (!foodItem.isAvailable) {
      await foodItem.save();
    }

    // Calculate average rating
    const reviews = await Review.find({ foodItem: foodItem._id });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    const itemObj = foodItem.toObject();
    itemObj.averageRating = avgRating ? parseFloat(avgRating.toFixed(2)) : null;
    // Ensure imageBase64 is included if it exists
    if (foodItem.imageBase64) {
      itemObj.imageBase64 = foodItem.imageBase64;
    }
    // Ensure restaurant ID is always available (even when populated)
    if (itemObj.restaurant && typeof itemObj.restaurant === "object") {
      // If restaurant is populated, ensure we have the ID
      if (!itemObj.restaurant.id && itemObj.restaurant._id) {
        itemObj.restaurant.id = itemObj.restaurant._id.toString();
      }
    }

    res.json({
      status: "success",
      data: { item: itemObj },
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
    })
      .populate("restaurant", "name address phone googleMapsLink location")
      .sort({ createdAt: -1 });

    // Calculate average ratings for each food item
    const foodItemsWithRatings = await Promise.all(
      foodItems.map(async (item) => {
        const reviews = await Review.find({ foodItem: item._id });
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : null;

        const itemObj = item.toObject();
        itemObj.averageRating = avgRating
          ? parseFloat(avgRating.toFixed(2))
          : null;
        // Ensure imageBase64 is included if it exists
        if (item.imageBase64) {
          itemObj.imageBase64 = item.imageBase64;
        }
        // Ensure restaurant ID is always available (even when populated)
        if (itemObj.restaurant && typeof itemObj.restaurant === "object") {
          // If restaurant is populated, ensure we have the ID
          if (!itemObj.restaurant.id && itemObj.restaurant._id) {
            itemObj.restaurant.id = itemObj.restaurant._id.toString();
          }
        }
        return itemObj;
      })
    );

    res.json({
      status: "success",
      results: foodItemsWithRatings.length,
      data: { items: foodItemsWithRatings },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create food item
// @route   POST /api/food-items
// @access  Private (restaurant_owner, admin)
exports.createFoodItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Помилка валідації",
        errors: errors.array(),
      });
    }

    // Перевіряємо що користувач має ресторан
    if (!req.user.restaurant) {
      return res.status(403).json({
        status: "error",
        message: "You must have a restaurant to add food items",
      });
    }

    // Валідація цін
    if (req.body.discountedPrice >= req.body.originalPrice) {
      return res.status(400).json({
        status: "error",
        message: "Discounted price must be less than original price",
      });
    }

    const foodItemData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || "Other",
      originalPrice: req.body.originalPrice,
      discountedPrice: req.body.discountedPrice,
      quantity: req.body.quantity,
      expiryTime: req.body.expiryTime,
      restaurant: req.user.restaurant,
      isAvailable: true,
    };

    // Only include imageBase64 if it exists and is not empty
    if (
      req.body.imageBase64 &&
      typeof req.body.imageBase64 === "string" &&
      req.body.imageBase64.trim().length > 0
    ) {
      foodItemData.imageBase64 = req.body.imageBase64.trim();
      console.log(
        "Saving imageBase64, length:",
        foodItemData.imageBase64.length
      );
    } else {
      console.log("No imageBase64 provided or empty");
    }

    const foodItem = await FoodItem.create(foodItemData);
    console.log("Food item created with imageBase64:", !!foodItem.imageBase64);

    await foodItem.populate("restaurant", "name address phone");

    res.status(201).json({
      status: "success",
      data: { item: foodItem },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update food item
// @route   PUT /api/food-items/:id
// @access  Private (restaurant_owner, admin)
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
    }).populate("restaurant", "name address phone");

    res.json({
      status: "success",
      data: { item: foodItem },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete food item
// @route   DELETE /api/food-items/:id
// @access  Private (restaurant_owner, admin)
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
