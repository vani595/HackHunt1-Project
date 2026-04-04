const mongoose = require("mongoose");

const { Schema } = mongoose;

const pendingSignupSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["user", "organizer", "admin"]
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    hashedPassword: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    organizationName: { type: String, default: null },
    adminLevel: { type: String, default: null },
    department: { type: String, default: null },
    failedVerifyAttempts: { type: Number, default: 0 },
    verifyLockedUntil: { type: Date, default: null }
  },
  { collection: "pending_signups" }
);

pendingSignupSchema.index({ email: 1, role: 1 }, { unique: true });

const PendingSignup =
  mongoose.models.PendingSignup ||
  mongoose.model("PendingSignup", pendingSignupSchema);

module.exports = { PendingSignup };
