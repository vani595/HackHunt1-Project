const express = require("express");
const bcrypt = require("bcryptjs");
const { User, Organizer, Admin } = require("../database/user");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

async function findAccountByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  return (
    (await User.findOne({ email: normalizedEmail })) ||
    (await Organizer.findOne({ email: normalizedEmail })) ||
    (await Admin.findOne({ email: normalizedEmail }))
  );
}

// Send OTP
router.post("/", async (req, res) => {
  const { email } = req.body;

  try {
    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    const user = await findAccountByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "No account is registered with this email."
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const message = `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`;

    const emailResult = await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message
    });

    if (emailResult?.skipped) {
      return res.status(200).json({
        message:
          "OTP generated. Email service is not configured on this server, so the OTP is returned for testing.",
        otp
      });
    }

    return res.status(200).json({
      message: "A verification code has been sent to your email address."
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again."
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await findAccountByEmail(email);

    if (!user || user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        message: "Invalid or expired OTP."
      });
    }

    return res.status(200).json({
      message: "OTP verified successfully. You can now reset your password."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong."
    });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await findAccountByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Password has been successfully updated."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong."
    });
  }
});

module.exports = router;
