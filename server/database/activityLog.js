const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admins",
      default: null
    },
    performedByName: { type: String, default: "System" },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    targetType: {
      type: String,
      enum: ["user", "organizer", "hackathon", "admin", null],
      default: null
    },
    targetName: { type: String, default: "" },
    description: { type: String, default: "" },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    status: { type: String, enum: ["success", "failure"], default: "success" },
    errorMessage: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// Index for efficient querying
activityLogSchema.index({ performedBy: 1, timestamp: -1 });
activityLogSchema.index({ targetId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

const ActivityLog =
  mongoose.models.activity_logs ||
  mongoose.model("activity_logs", activityLogSchema);

module.exports = { ActivityLog };
