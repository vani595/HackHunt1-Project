const mongoose = require("mongoose");
const { Admin, User, Organizer } = require("../../database/user");
const { Hackathon, HackathonRegistration } = require("../../database/hackathon");
const { ActivityLog } = require("../../database/activityLog");
const bcryptjs = require("bcryptjs");
const { createActivity } = require("../realtimeHub");
const { getActivityLog } = require("../realtimeHub");

const isDbConnected = () => mongoose.connection.readyState === 1;

const buildAccountSummary = (account, roleOverride = "") => {
  const role = roleOverride || account.role || "user";

  return {
    id: String(account._id),
    role,
    name: `${account.firstName || ""} ${account.lastName || ""}`.trim() || account.email,
    firstName: account.firstName || "",
    lastName: account.lastName || "",
    email: account.email,
    phoneNumber: account.phoneNumber || "",
    status: account.isActive ? "active" : "blocked",
    isActive: Boolean(account.isActive),
    joinDate: account.createdAt,
    createdAt: account.createdAt,
    lastLogin: account.lastLogin || null,
    hackathonsJoined: Array.isArray(account.joinedHackathons)
      ? account.joinedHackathons.length
      : 0,
    registrations: Array.isArray(account.joinedHackathons)
      ? account.joinedHackathons.length
      : 0,
    hackathonsCreated: Array.isArray(account.hackathonsCreated)
      ? account.hackathonsCreated.length
      : 0,
    participants: Array.isArray(account.hackathonsManaged)
      ? account.hackathonsManaged.length
      : 0,
    organizationName: account.organizationName || "",
    isVerified: Boolean(account.isVerified),
    adminLevel: account.adminLevel || "",
    department: account.department || ""
  };
};

// Helper: Log activity
const logActivity = async (adminId, action, targetId, targetType, description = "", status = "success", errorMessage = "") => {
  try {
    const admin = await Admin.findById(adminId);
    if (!admin) return;

    const log = new ActivityLog({
      action,
      performedBy: adminId,
      performedByName: `${admin.firstName} ${admin.lastName}`,
      targetId: targetId || null,
      targetType,
      description,
      status,
      errorMessage
    });
    await log.save();

    createActivity({
      type: action,
      authorId: String(adminId),
      authorName: `${admin.firstName} ${admin.lastName}`.trim(),
      authorRole: "admin",
      message: description || action.replace(/_/g, " "),
      targetId: targetId ? String(targetId) : null,
      targetType,
      status,
      timestamp: log.timestamp
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

// ==================== PLATFORM STATS ====================
const getPlatformStats = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        totalUsers: 0,
        totalOrganizers: 0,
        totalHackathons: 0,
        pendingApprovals: 0,
        approvedHackathons: 0,
        activeUsers: 0,
        blockedUsers: 0,
        activeOrganizers: 0,
        verifiedOrganizers: 0,
        totalRegistrations: 0,
        stats: {
          users: { total: 0, active: 0, blocked: 0 },
          organizers: { total: 0, active: 0, verified: 0 },
          hackathons: { total: 0, pending: 0, approved: 0 },
          registrations: { total: 0 }
        },
        databaseOffline: true
      });
    }

    const totalUsers = await User.countDocuments();
    const totalOrganizers = await Organizer.countDocuments();
    const totalHackathons = await Hackathon.countDocuments();
    const pendingApprovals = await Hackathon.countDocuments({ status: "pending" });
    const approvedHackathons = await Hackathon.countDocuments({ status: "approved" });
    const activeUsers = await User.countDocuments({ isActive: true });
    const blockedUsers = await User.countDocuments({ isActive: false });
    const activeOrganizers = await Organizer.countDocuments({ isActive: true });
    const verifiedOrganizers = await Organizer.countDocuments({ isVerified: true });
    const totalRegistrations = await HackathonRegistration.countDocuments();

    res.json({
      totalUsers,
      totalOrganizers,
      totalHackathons,
      pendingApprovals,
      approvedHackathons,
      activeUsers,
      blockedUsers,
      activeOrganizers,
      verifiedOrganizers,
      totalRegistrations,
      stats: {
        users: { total: totalUsers, active: activeUsers, blocked: blockedUsers },
        organizers: {
          total: totalOrganizers,
          active: activeOrganizers,
          verified: verifiedOrganizers
        },
        hackathons: {
          total: totalHackathons,
          pending: pendingApprovals,
          approved: approvedHackathons
        },
        registrations: {
          total: totalRegistrations
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch platform stats" });
  }
};

// ==================== ADMIN PROFILE ====================
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.params.adminId || req.body?.adminId;
    const admin = await Admin.findById(adminId).select("-password -resetPasswordOTP -resetPasswordExpires");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        adminLevel: admin.adminLevel,
        department: admin.department,
        profilePicture: admin.profilePicture,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin profile" });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.params.adminId || req.body?.adminId;
    const { firstName, lastName, phoneNumber, profilePicture, currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword || !(await bcryptjs.compare(currentPassword, admin.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      admin.password = await bcryptjs.hash(newPassword, 10);
    }

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phoneNumber) admin.phoneNumber = phoneNumber;
    if (profilePicture) admin.profilePicture = profilePicture;

    await admin.save();

    await logActivity(adminId, "profile_updated", adminId, "admin", "Admin profile updated");

    res.json({
      message: "Profile updated successfully",
      admin: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        profilePicture: admin.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// ==================== USER MANAGEMENT ====================
const getAllUsers = async (req, res) => {
  try {
    const { search = "", isActive = "", page = 1, limit = 10 } = req.query;

    if (!isDbConnected()) {
      return res.json({
        users: [],
        pagination: {
          total: 0,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: 0
        },
        databaseOffline: true
      });
    }

    const query = {};
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
      ];
    }
    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password -resetPasswordOTP -resetPasswordExpires")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users: users.map((u) => buildAccountSummary(u, "user")),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.adminId || req.body.adminId;

    if (!adminId) {
      return res.status(401).json({ message: "Admin ID not found" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await logActivity(adminId, "user_deleted", userId, "user", `Deleted user: ${user.email}`, "success");

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const adminId = req.adminId || req.body.adminId;

    if (!adminId) {
      return res.status(401).json({ message: "Admin ID not found" });
    }

    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const action = isActive ? "user_unblocked" : "user_blocked";
    const description = isActive ? `Unblocked user: ${user.email}` : `Blocked user: ${user.email}`;

    await logActivity(adminId, action, userId, "user", description, "success");

    res.json({
      message: `User ${isActive ? "unblocked" : "blocked"} successfully`,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

// ==================== ORGANIZER MANAGEMENT ====================
const getAllOrganizers = async (req, res) => {
  try {
    const { search = "", isVerified = "", page = 1, limit = 10 } = req.query;

    if (!isDbConnected()) {
      return res.json({
        organizers: [],
        pagination: {
          total: 0,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: 0
        },
        databaseOffline: true
      });
    }

    const query = {};
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, "i") },
        { organizationName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") }
      ];
    }
    if (isVerified !== "") {
      query.isVerified = isVerified === "true";
    }

    const skip = (page - 1) * limit;
    const organizers = await Organizer.find(query)
      .select("-password -resetPasswordOTP -resetPasswordExpires")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Organizer.countDocuments(query);

    res.json({
      organizers: organizers.map((org) => buildAccountSummary(org, "organizer")),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch organizers" });
  }
};

const deleteOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const adminId = req.adminId || req.body?.adminId;

    const organizer = await Organizer.findByIdAndDelete(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    await logActivity(adminId, "organizer_deleted", organizerId, "organizer", `Deleted organizer: ${organizer.email}`, "success");

    res.json({ message: "Organizer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete organizer" });
  }
};

const verifyOrganizer = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { isVerified } = req.body;
    const adminId = req.adminId || req.body?.adminId;

    const organizer = await Organizer.findByIdAndUpdate(
      organizerId,
      { isVerified },
      { new: true }
    );

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    const description = isVerified ? `Verified organizer: ${organizer.email}` : `Rejected organizer: ${organizer.email}`;
    await logActivity(
      adminId,
      isVerified ? "organizer_created" : "settings_changed",
      organizerId,
      "organizer",
      description,
      "success"
    );

    res.json({
      message: `Organizer ${isVerified ? "verified" : "rejected"} successfully`,
      organizer: {
        id: organizer._id,
        organizationName: organizer.organizationName,
        isVerified: organizer.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify organizer" });
  }
};

// ==================== ACTIVITY LOG ====================
const getActivityLogs = async (req, res) => {
  try {
    const { action = "", page = 1, limit = 20 } = req.query;

    if (!isDbConnected()) {
      const memoryLogs = getActivityLog()
        .filter((item) => !action || String(item.type || item.action || "").includes(action))
        .slice(0, parseInt(limit, 10))
        .map((item) => ({
          id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          action: item.action || item.type || "activity",
          performedBy: item.performedBy || item.authorName || "System",
          targetName: item.targetName || "",
          description: item.description || item.message || "",
          status: item.status || "success",
          timestamp: item.timestamp || item.createdAt || new Date().toISOString()
        }));

      return res.json({
        logs: memoryLogs,
        pagination: {
          total: memoryLogs.length,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: memoryLogs.length ? 1 : 0
        },
        databaseOffline: true
      });
    }

    const query = {};
    if (action) {
      query.action = action;
    }

    const skip = (page - 1) * limit;
    const logs = await ActivityLog.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });

    const total = await ActivityLog.countDocuments(query);

    res.json({
      logs: logs.map((log) => ({
        id: log._id,
        action: log.action,
        performedBy: log.performedByName,
        targetName: log.targetName,
        description: log.description,
        status: log.status,
        timestamp: log.timestamp
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};

module.exports = {
  getPlatformStats,
  getAdminProfile,
  updateAdminProfile,
  getAllUsers,
  deleteUser,
  blockUser,
  getAllOrganizers,
  deleteOrganizer,
  verifyOrganizer,
  getActivityLogs,
  logActivity
};
