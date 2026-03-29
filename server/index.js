const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { userRouter } = require("./database/user");
const { adminRouter } = require("./routes/admin");
const forgotPasswordRoutes = require("./routes/forgotPassword");
const hackathonRoutes = require("./routes/hackathonRoutes");
const { realtimeRouter } = require("./routes/realtime");
const chatRoute = require("./routes/chatRoute");
const contactRoutes = require("./routes/contact");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/project1";

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
app.use("/api/v1/hackathons", hackathonRoutes);
app.use("/api/v1/realtime", realtimeRouter);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/chat", chatRoute);
app.use("/api/v1/contact", contactRoutes);

async function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
  });

  let connected = false;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB connected: ${MONGODB_URI}`);
    connected = true;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    const fallbackUri = "mongodb://127.0.0.1:27017/project1";
    if (MONGODB_URI !== fallbackUri) {
      try {
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000
        });
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