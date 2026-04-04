const mongoose = require("mongoose");

const { Schema } = mongoose;

const otpSendLogSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    sentAt: { type: Date, default: Date.now, index: true }
  },
  { collection: "otp_send_logs" }
);

otpSendLogSchema.index({ email: 1, sentAt: -1 });

const OtpSendLog =
  mongoose.models.OtpSendLog || mongoose.model("OtpSendLog", otpSendLogSchema);

module.exports = { OtpSendLog };
