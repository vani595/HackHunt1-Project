require("dotenv").config(); 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const refreshData = require("./scheduler");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend")));

const MONGO_URI = process.env.MONGO_URI;

// Schema for Hackathons
const hackathonSchema = new mongoose.Schema({}, { strict: false });
const Hackathon = mongoose.models.Hackathon || mongoose.model("Hackathon", hackathonSchema, "hackathons");

// 1. Get Hackathons API
app.get("/api/hackathons", async (req, res) => {
  try {
    const data = await Hackathon.find({});
    res.json({
      updatedAt: new Date().toISOString(),
      total: data.length,
      hackathons: data
    });
  } catch (error) {
    res.status(500).json({ error: "Database se data nahi mil raha" });
  }
});

// 2. Manual Refresh API
app.get("/api/refresh", async (req, res) => {
  try {
    console.log("Refreshing data manually...");
    await refreshData();
    res.json({ message: "Refreshed Successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Refresh failed" });
  }
});

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is missing in .env");
  process.exit(1); 
}

// Database Connection & Server Start
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB Railway");
    app.listen(3000, async () => {
      console.log("Backend server running on port 3000");
      
      // Start hote hi ek baar data fetch karega
      console.log("Running initial scrape...");
      await refreshData();

      // AUTO-TIMER: Har 12 ghante mein apne aap chalega
      setInterval(async () => {
        console.log("Running scheduled auto-refresh...");
        await refreshData();
      }, 12 * 60 * 60 * 1000);
    });
  })
  .catch(err => console.error("MongoDB Connection Error:", err));