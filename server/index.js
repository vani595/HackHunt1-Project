const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const { userRouter } = require("./database/user");
const { adminRouter } = require("./routes/admin");
const forgotPasswordRoutes = require("./routes/forgotPassword");
const hackathonRoutes = require("./routes/hackathonRoutes");
const { realtimeRouter } = require("./routes/realtime");
const authSignupOtpRoutes = require("./routes/authSignupOtp");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/project1";

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    databaseState: mongoose.connection.readyState
  });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/forgot-password", forgotPasswordRoutes);
app.use("/api/v1/auth", authSignupOtpRoutes);
app.use("/api/auth", authSignupOtpRoutes);
app.use("/api/v1/hackathons", hackathonRoutes);
app.use("/api/v1/realtime", realtimeRouter);
app.use("/api/hackathons", hackathonRoutes);

// ── Contact Form Route ──
app.post("/api/v1/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"HackHunt 🚀" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[HackHunt Contact] ${subject}`,
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    res.json({ message: "Message sent successfully! We'll get back to you soon." });
  } catch (error) {
    console.error("Contact route error:", error);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
});

async function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
  });

  let connected = false;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${MONGODB_URI}`);
    connected = true;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    const fallbackUri = "mongodb://127.0.0.1:27017/project1";
    if (MONGODB_URI !== fallbackUri) {
      try {
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`MongoDB fallback connected: ${fallbackUri}`);
        connected = true;
      } catch (fallbackError) {
        console.error("MongoDB fallback failed:", fallbackError.message);
      }
    }
    if (!connected) {
      console.error("Continuing without a live database connection.");
    }
  }
}

startServer();