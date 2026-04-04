const { Router } = require("express");
const {
  getPlatformStats,
  getAdminProfile,
  updateAdminProfile,
  getAllUsers,
  deleteUser,
  blockUser,
  getAllOrganizers,
  deleteOrganizer,
  verifyOrganizer,
  getActivityLogs
} = require("../utils/controllers/adminController");

const adminRouter = Router();

// Middleware: Check if admin
const requireAdmin = (req, res, next) => {
  const adminId = req.body?.adminId || req.query?.adminId || req.headers["x-admin-id"];
  if (!adminId) {
    return res.status(401).json({ message: "Unauthorized: Admin ID required" });
  }
  req.adminId = adminId;
  next();
};

// ==================== PLATFORM STATS ====================
adminRouter.get("/stats", requireAdmin, getPlatformStats);
adminRouter.post("/stats", requireAdmin, getPlatformStats);

// ==================== ADMIN PROFILE ====================
adminRouter.get("/profile/:adminId", getAdminProfile);
adminRouter.put("/profile/:adminId", updateAdminProfile);
adminRouter.post("/profile/update", updateAdminProfile);

// ==================== USER MANAGEMENT ====================
adminRouter.get("/users", requireAdmin, getAllUsers);
adminRouter.delete("/users/:userId", requireAdmin, deleteUser);
adminRouter.patch("/users/:userId/block", requireAdmin, blockUser);

// ==================== ORGANIZER MANAGEMENT ====================
adminRouter.get("/organizers", requireAdmin, getAllOrganizers);
adminRouter.delete("/organizers/:organizerId", requireAdmin, deleteOrganizer);
adminRouter.patch("/organizers/:organizerId/verify", requireAdmin, verifyOrganizer);

// ==================== ACTIVITY LOGS ====================
adminRouter.get("/activity-logs", requireAdmin, getActivityLogs);

module.exports = {
  adminRouter: adminRouter
};
