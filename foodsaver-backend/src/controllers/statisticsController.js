// controllers/statisticsController.js
const Order = require("../models/Order");
const FoodItem = require("../models/FoodItem");
const Restaurant = require("../models/Restaurant");
const Review = require("../models/Review");

// @desc    Get restaurant statistics
// @route   GET /api/statistics/restaurant/:restaurantId
// @access  Private (restaurant_owner, admin)
exports.getRestaurantStatistics = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { period = "all" } = req.query; // all, week, month, year

    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(restaurantId);
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
        message: "Not authorized to view these statistics",
      });
    }

    // Calculate date range based on period
    let startDate = new Date(0); // Beginning of time
    if (period === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get all orders for this restaurant
    const ordersQuery = {
      restaurant: restaurantId,
      status: { $in: ["confirmed", "ready", "completed"] },
      createdAt: { $gte: startDate },
    };

    const orders = await Order.find(ordersQuery).populate("items.foodItem");

    // Calculate statistics
    let totalFoodSaved = 0; // Total quantity of items sold
    let totalMoneySaved = 0; // Total discount amount
    let totalRevenue = 0; // Total revenue from orders
    let totalOrders = orders.length;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const foodItem = item.foodItem;
        if (foodItem) {
          totalFoodSaved += item.quantity;
          const discountAmount =
            (foodItem.originalPrice - foodItem.discountedPrice) *
            item.quantity;
          totalMoneySaved += discountAmount;
          totalRevenue += item.price * item.quantity;
        }
      });
    });

    // Get average rating
    const reviews = await Review.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate },
    });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    // Get food items statistics
    const foodItems = await FoodItem.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate },
    });

    const totalItemsCreated = foodItems.length;
    const itemsSold = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    // Weekly/Monthly breakdown for charts
    const weeklyData = [];
    const monthlyData = [];

    if (period === "month" || period === "all") {
      // Get last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const weekOrders = orders.filter(
          (o) => o.createdAt >= weekStart && o.createdAt < weekEnd
        );

        let weekFoodSaved = 0;
        let weekMoneySaved = 0;

        weekOrders.forEach((order) => {
          order.items.forEach((item) => {
            const foodItem = item.foodItem;
            if (foodItem) {
              weekFoodSaved += item.quantity;
              weekMoneySaved +=
                (foodItem.originalPrice - foodItem.discountedPrice) *
                item.quantity;
            }
          });
        });

        weeklyData.push({
          week: `Week ${4 - i}`,
          foodSaved: weekFoodSaved,
          moneySaved: weekMoneySaved,
          orders: weekOrders.length,
        });
      }
    }

    if (period === "year" || period === "all") {
      // Get last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - (i + 1));
        monthStart.setDate(1);
        const monthEnd = new Date();
        monthEnd.setMonth(monthEnd.getMonth() - i);
        monthEnd.setDate(0);

        const monthOrders = orders.filter(
          (o) => o.createdAt >= monthStart && o.createdAt <= monthEnd
        );

        let monthFoodSaved = 0;
        let monthMoneySaved = 0;

        monthOrders.forEach((order) => {
          order.items.forEach((item) => {
            const foodItem = item.foodItem;
            if (foodItem) {
              monthFoodSaved += item.quantity;
              monthMoneySaved +=
                (foodItem.originalPrice - foodItem.discountedPrice) *
                item.quantity;
            }
          });
        });

        monthlyData.push({
          month: monthStart.toLocaleString("default", { month: "short" }),
          foodSaved: monthFoodSaved,
          moneySaved: monthMoneySaved,
          orders: monthOrders.length,
        });
      }
    }

    res.json({
      status: "success",
      data: {
        summary: {
          totalFoodSaved,
          totalMoneySaved: parseFloat(totalMoneySaved.toFixed(2)),
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalOrders,
          averageRating: parseFloat(avgRating.toFixed(2)),
          totalItemsCreated,
          itemsSold,
        },
        charts: {
          weekly: weeklyData,
          monthly: monthlyData,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

