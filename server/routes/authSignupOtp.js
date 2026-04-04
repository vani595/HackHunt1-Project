const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  User,
  Organizer,
  Admin,
  normalizeSignupInput,
  validateSignupInput,
  hashPassword,
  getModelForRole
} = require("../database/user");
const { PendingSignup } = require("../database/pendingSignup");
const { OtpSendLog } = require("../database/loginOtpModels");
const sendEmail = require("../utils/sendEmail");
const { broadcast, createActivity } = require("../utils/realtimeHub");

const router = express.Router();

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_EMAIL_PER_HOUR = 3;
const MAX_VERIFY_FAILURES = 5;
const VERIFY_LOCKOUT_MS = 15 * 60 * 1000;

function getJwtSecret() {
  return process.env.JWT_SECRET || process.env.OTP_PEPPER || "change-me-in-production";
}

function getOtpPepper() {
  return process.env.OTP_PEPPER || getJwtSecret();
}

function hashSignupOtp(email, role, otp) {
  return crypto
    .createHmac("sha256", getOtpPepper())
    .update(`signup:${email}:${role}:${otp}`)
    .digest("hex");
}

function timingSafeEqualHex(a, b) {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function signAuthToken(userDoc, role) {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      sub: String(userDoc._id),
      email: userDoc.email,
      role
    },
    secret,
    { expiresIn: "7d" }
  );
}

/** POST /send-signup-otp — validate data, store pending signup, email OTP */
router.post("/send-signup-otp", async (req, res) => {
  try {
    const role = String(req.body?.role || "user").toLowerCase();
    if (!["user", "organizer", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      organizationName,
      adminLevel,
      department
    } = req.body;
    const normalizedInput = normalizeSignupInput({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      organizationName: role === "organizer" ? organizationName : null
    });

    const validationErrors = validateSignupInput(
      normalizedInput.email,
      normalizedInput.password,
      normalizedInput.firstName,
      normalizedInput.lastName,
      normalizedInput.phoneNumber,
      normalizedInput.organizationName
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const normalizedEmail = normalizedInput.email;
    const normalizedPhoneNumber = normalizedInput.phoneNumber;
    const model = getModelForRole(role);
    const existingUser = await model.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sendsLastHour = await OtpSendLog.countDocuments({
      email: normalizedEmail,
      sentAt: { $gte: oneHourAgo }
    });

    if (sendsLastHour >= MAX_SENDS_PER_EMAIL_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests for this email. Try again in an hour."
      });
    }

    const hashedPassword = await hashPassword(password);
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const otpHash = hashSignupOtp(normalizedEmail, role, otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await PendingSignup.findOneAndUpdate(
      { email: normalizedEmail, role },
      {
        email: normalizedEmail,
        role,
        otpHash,
        expiresAt,
        hashedPassword,
        firstName: normalizedInput.firstName,
        lastName: normalizedInput.lastName,
        phoneNumber: normalizedPhoneNumber,
        organizationName: role === "organizer" ? normalizedInput.organizationName : null,
        adminLevel: role === "admin" ? adminLevel || "moderator" : null,
        department: role === "admin" ? String(department || "").trim() : null,
        failedVerifyAttempts: 0,
        verifyLockedUntil: null
      },
      { upsert: true, new: true }
    );

    await OtpSendLog.create({ email: normalizedEmail, sentAt: new Date() });

    const emailResult = await sendEmail({
      email: normalizedEmail,
      subject: "Your verification code",
      message: `Your OTP is: ${otp}. It expires in 10 minutes.`
    });

    if (emailResult?.skipped) {
      console.warn(
        `[signup OTP] Email not configured; OTP for ${normalizedEmail} not sent via mail.`
      );
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent"
    });
  } catch (err) {
    console.error("send-signup-otp error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP, try again"
    });
  }
});

/** POST /resend-signup-otp — new code for existing pending signup */
router.post("/resend-signup-otp", async (req, res) => {
  try {
    const role = String(req.body?.role || "user").toLowerCase();
    const emailRaw = req.body?.email;
    if (!["user", "organizer", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }
    const email = String(emailRaw || "")
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const pending = await PendingSignup.findOne({ email, role });
    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found. Start signup again."
      });
    }

    if (pending.verifyLockedUntil && pending.verifyLockedUntil > new Date()) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Try again after the lockout period."
      });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sendsLastHour = await OtpSendLog.countDocuments({
      email,
      sentAt: { $gte: oneHourAgo }
    });
    if (sendsLastHour >= MAX_SENDS_PER_EMAIL_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests for this email. Try again in an hour."
      });
    }

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const otpHash = hashSignupOtp(email, role, otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    pending.otpHash = otpHash;
    pending.expiresAt = expiresAt;
    pending.failedVerifyAttempts = 0;
    pending.verifyLockedUntil = null;
    await pending.save();

    await OtpSendLog.create({ email, sentAt: new Date() });

    const emailResult = await sendEmail({
      email,
      subject: "Your verification code",
      message: `Your OTP is: ${otp}. It expires in 10 minutes.`
    });

    if (emailResult?.skipped) {
      console.warn(`[signup resend] Email not configured for ${email}`);
    }

    return res.status(200).json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("resend-signup-otp error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP, try again"
    });
  }
});

/** POST /verify-signup-otp — verify OTP and create account */
router.post("/verify-signup-otp", async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    const otpRaw = req.body?.otp;
    const role = String(req.body?.role || "user").toLowerCase();

    if (!["user", "organizer", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const email = String(emailRaw || "")
      .trim()
      .toLowerCase();
    const otp = String(otpRaw || "").replace(/\D/g, "");

    if (!email || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const pending = await PendingSignup.findOne({ email, role });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    if (pending.verifyLockedUntil && pending.verifyLockedUntil > new Date()) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Try again in 15 minutes."
      });
    }

    const now = new Date();
    const expired = pending.expiresAt < now;
    const submittedHash = hashSignupOtp(email, role, otp);
    const matches = !expired && timingSafeEqualHex(submittedHash, pending.otpHash);

    if (!matches) {
      pending.failedVerifyAttempts = (pending.failedVerifyAttempts || 0) + 1;
      if (pending.failedVerifyAttempts >= MAX_VERIFY_FAILURES) {
        pending.verifyLockedUntil = new Date(Date.now() + VERIFY_LOCKOUT_MS);
      }
      await pending.save();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const model = getModelForRole(role);
    const duplicate = await model.findOne({ email });
    if (duplicate) {
      await PendingSignup.deleteOne({ _id: pending._id });
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const baseUser = {
      email,
      password: pending.hashedPassword,
      firstName: pending.firstName,
      lastName: pending.lastName,
      phoneNumber: pending.phoneNumber,
      role
    };

    if (role === "organizer") {
      baseUser.organizationName = pending.organizationName;
    }
    if (role === "admin") {
      baseUser.adminLevel = pending.adminLevel || "moderator";
      baseUser.department = pending.department || "";
    }

    const user = await model.create(baseUser);

    await PendingSignup.deleteOne({ _id: pending._id });

    const token = signAuthToken(user, role);

    broadcast("user:created", {
      userId: String(user._id),
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });

    createActivity({
      type: `${user.role}_signup`,
      authorId: String(user._id),
      authorName: `${user.firstName} ${user.lastName}`.trim(),
      authorRole: user.role,
      message: `${user.firstName} joined the platform as ${user.role}.`,
      targetId: String(user._id),
      targetType: user.role
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      userId: user._id,
      role: user.role,
      firstName: user.firstName,
      email: user.email
    });
  } catch (err) {
    console.error("verify-signup-otp error:", err);
    return res.status(500).json({
      success: false,
      message: "Could not complete registration. Try again."
    });
  }
});

module.exports = router;
