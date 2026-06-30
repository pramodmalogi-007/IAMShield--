// backend/routes/adminAuthRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { findOne, findAll, insertOne, updateOne, count } = require("../utils/fileStore");
const { getAllRequests, updateRequestStatus } = require("../controllers/requestController");
const { adminAuthMiddleware } = require("../middleware/adminAuth");
const { getAdminLogs } = require("../controllers/logController");

const router = express.Router();

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ADMINS_FILE = "admins.json";
const USERS_FILE = "users.json";
const REQUESTS_FILE = "accessRequests.json";
const LOGS_FILE = "activityLogs.json";

// Simple auth middleware for /list
const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: "No token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ===== ADMIN REGISTER =====
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Name, email, password required" });
    }

    const existing = findOne(ADMINS_FILE, (a) => a.email === email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: "Admin with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();
    const admin = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      role: "admin",
      createdAt: now,
      updatedAt: now,
    };

    insertOne(ADMINS_FILE, admin);

    return res.status(201).json({
      success: true,
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (err) {
    console.error("Admin register error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ===== ADMIN LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = findOne(ADMINS_FILE, (a) => a.email === email?.toLowerCase().trim());
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      admin: { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ===== LIST ADMINS =====
router.get("/list", authMiddleware, (req, res) => {
  try {
    const admins = findAll(ADMINS_FILE)
      .map(({ id, name, email, role, createdAt }) => ({ id, name, email, role, createdAt }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, admins });
  } catch (err) {
    console.error("Admin list error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ===== LOGS =====
router.get("/logs", adminAuthMiddleware, getAdminLogs);

// ===== REQUESTS =====
router.get("/requests", adminAuthMiddleware, getAllRequests);
router.put("/requests/:id", adminAuthMiddleware, updateRequestStatus);

// ===== STATS =====
router.get("/stats", adminAuthMiddleware, (req, res) => {
  try {
    const totalUsers = count(USERS_FILE);
    const totalAdmins = count(ADMINS_FILE);
    const totalRequests = count(REQUESTS_FILE);
    const pendingRequests = count(REQUESTS_FILE, (r) => r.status === "pending");
    const approvedRequests = count(REQUESTS_FILE, (r) => r.status === "approved");
    const deniedRequests = count(REQUESTS_FILE, (r) => r.status === "denied");
    const totalLogs = count(LOGS_FILE);

    return res.json({
      success: true,
      totalUsers,
      totalAdmins,
      totalRequests,
      pendingRequests,
      approvedRequests,
      deniedRequests,
      totalLogs,
      totalAssessments: 0,
    });
  } catch (err) {
    console.error("Stats fetch error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ===== USERS LIST =====
router.get("/users", adminAuthMiddleware, (req, res) => {
  try {
    const users = findAll(USERS_FILE)
      .map(({ uid, fullName, email, role, isActive, lastLogin, loginCount, createdAt }) => ({
        uid, fullName, email, role, isActive, lastLogin, loginCount, createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, users });
  } catch (err) {
    console.error("Users list error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ===== TOGGLE USER ACTIVE =====
router.put("/users/:uid/toggle", adminAuthMiddleware, (req, res) => {
  try {
    const user = findOne(USERS_FILE, (u) => u.uid === req.params.uid);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const newActive = !user.isActive;
    updateOne(USERS_FILE, (u) => u.uid === req.params.uid, () => ({ isActive: newActive }));

    const { insertOne: ins } = require("../utils/fileStore");
    ins(LOGS_FILE, {
      id: uuidv4(),
      actor: req.admin?.adminId || "System",
      actorId: req.admin?.adminId || null,
      action: newActive ? "Activated user account" : "Deactivated user account",
      target: user.email,
      ip: req.ip || "",
      createdAt: new Date().toISOString(),
    });

    return res.json({ success: true, user: { ...user, isActive: newActive } });
  } catch (err) {
    console.error("User toggle error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;