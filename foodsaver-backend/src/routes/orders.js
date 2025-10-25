const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");
const { orderValidation } = require("../utils/validators");

router.use(protect);

router.get("/", getOrders);
router.get("/:id", getOrder);

// створити замовлення
router.post("/", orderValidation, createOrder);

// оновити статус замовлення (тільки ресторан/адмін)
router.put("/:id/status", authorize("restaurant", "admin"), updateOrderStatus);

// Скасувати замовлення (тільки користувач)
router.delete("/:id", cancelOrder);

module.exports = router;
