const Order = require("../models/Order");
const FoodItem = require("../models/FoodItem");
const { validationResult } = require("express-validator");

// @desc    Get all orders for user
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    let query = {};

    // Користувачі бачать тільки свої замовлення
    if (req.user.role === "user") {
      query.user = req.user._id;
    }
    // Власники ресторанів бачать замовлення своїх ресторанів
    else if (req.user.role === "restaurant") {
      query.restaurant = { $in: req.user.restaurants }; // потрібно додати поле restaurants в User model
    }
    // Адміни бачать всі замовлення

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .populate("restaurant", "name address phone")
      .populate("items.foodItem", "name originalPrice discountedPrice")
      .sort({ createdAt: -1 });

    res.json({
      status: "success",
      results: orders.length,
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("restaurant", "name address phone")
      .populate(
        "items.foodItem",
        "name description originalPrice discountedPrice"
      );

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Перевірка прав доступу
    if (
      req.user.role === "user" &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to access this order",
      });
    }

    res.json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const { items, restaurant, pickupTime, notes } = req.body;

    // Перевірка та розрахунок загальної суми
    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const foodItem = await FoodItem.findById(item.foodItem);

      if (!foodItem) {
        return res.status(404).json({
          status: "error",
          message: `Food item ${item.foodItem} not found`,
        });
      }

      if (!foodItem.isAvailable || foodItem.quantity < item.quantity) {
        return res.status(400).json({
          status: "error",
          message: `${foodItem.name} is not available in requested quantity`,
        });
      }

      // Перевірка терміну придатності
      if (new Date() > foodItem.expiryTime) {
        return res.status(400).json({
          status: "error",
          message: `${foodItem.name} has expired`,
        });
      }

      const itemTotal = foodItem.discountedPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        foodItem: item.foodItem,
        quantity: item.quantity,
        price: foodItem.discountedPrice,
      });

      // Зменшуємо кількість в наявності
      foodItem.quantity -= item.quantity;
      if (foodItem.quantity === 0) {
        foodItem.isAvailable = false;
      }
      await foodItem.save();
    }

    // Створення замовлення
    const order = await Order.create({
      user: req.user._id,
      restaurant,
      items: orderItems,
      totalAmount,
      pickupTime,
      notes,
    });

    await order.populate([
      { path: "user", select: "name email phone" },
      { path: "restaurant", select: "name address phone" },
      { path: "items.foodItem", select: "name description" },
    ]);

    res.status(201).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (restaurant owner/admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "ready",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid status",
      });
    }

    const order = await Order.findById(req.params.id).populate("restaurant");

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Тільки власник ресторану або адмін можуть оновлювати статус
    if (
      order.restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this order",
      });
    }

    // Логіка повернення товарів при скасуванні
    if (status === "cancelled" && order.status !== "cancelled") {
      for (let orderItem of order.items) {
        const foodItem = await FoodItem.findById(orderItem.foodItem);
        if (foodItem) {
          foodItem.quantity += orderItem.quantity;
          if (foodItem.quantity > 0 && new Date() < foodItem.expiryTime) {
            foodItem.isAvailable = true;
          }
          await foodItem.save();
        }
      }
    }

    order.status = status;
    await order.save();

    res.json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private (user who made order)
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "error",
        message: "Order not found",
      });
    }

    // Тільки користувач який зробив замовлення може його скасувати
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to cancel this order",
      });
    }

    // Можна скасовувати тільки pending або confirmed замовлення
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        status: "error",
        message: "Cannot cancel order in current status",
      });
    }

    // Повертаємо товари в наявність
    for (let orderItem of order.items) {
      const foodItem = await FoodItem.findById(orderItem.foodItem);
      if (foodItem) {
        foodItem.quantity += orderItem.quantity;
        if (foodItem.quantity > 0 && new Date() < foodItem.expiryTime) {
          foodItem.isAvailable = true;
        }
        await foodItem.save();
      }
    }

    order.status = "cancelled";
    await order.save();

    res.json({
      status: "success",
      message: "Order cancelled successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
