// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Захист приватних route
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Not authorized to access this route",
    });
  }
};

// Перевірка ролі користувача
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};
