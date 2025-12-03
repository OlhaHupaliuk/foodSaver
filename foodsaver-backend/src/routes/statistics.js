// routes/statistics.js
const express = require("express");
const router = express.Router();
const statisticsController = require("../controllers/statisticsController");
const { protect } = require("../middleware/auth");

// GET restaurant statistics
router.get(
  "/restaurant/:restaurantId",
  protect,
  statisticsController.getRestaurantStatistics
);

module.exports = router;
