require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const FoodItem = require("./models/FoodItem");
const { ensureFoodItemLocations } = require("./utils/ensureFoodItemLocations");

// Ініціалізація Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
console.log(
  "Body parser configured with 50MB limit for JSON and URL-encoded data"
);

// Тестовий route
app.get("/", (req, res) => {
  res.json({
    message: "FoodSaver API is running",
    status: "success",
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/restaurants", require("./routes/restaurants"));
app.use("/api/food-items", require("./routes/foodItems"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/statistics", require("./routes/statistics"));

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle payload too large error specifically
  if (err.type === "entity.too.large" || err.message?.includes("too large")) {
    return res.status(413).json({
      status: "error",
      message:
        "Файл занадто великий. Будь ласка, виберіть менше фото або зменшіть його розмір.",
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    status: "error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    status: "error",
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    await connectDB();
    await ensureFoodItemLocations();
    await FoodItem.syncIndexes();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Обробка помилок при завершенні процесу
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log(" SIGTERM received, shutting down gracefully");
  process.exit(0);
});
