// backend/middleware/adminAuth.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

exports.adminAuthMiddleware = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded should contain { adminId, role }
    req.admin = decoded;
    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};