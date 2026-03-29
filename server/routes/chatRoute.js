// ============================================================
// server/routes/chatRoute.js
// ============================================================

const express = require("express");
const router = express.Router();
const { handleChat } = require("../Chatbot");
const path = require("path");
const fs = require("fs");

// Load scraped hackathon JSON data
const dataPath = path.join(__dirname, "../../src/data/unstop_scraped_data.json");
let allHackathons = [];
try {
  allHackathons = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`✅ Loaded ${allHackathons.length} hackathons from JSON`);
} catch (e) {
  console.log("⚠️ Could not load hackathon JSON:", e.message);
}

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: "Message is required." });

    const lower = message.toLowerCase();
    let hackathons = allHackathons;

    // ── Location filter ──
    if (lower.includes("rajasthan") || lower.includes("jaipur") || lower.includes("udaipur") || lower.includes("jodhpur")) {
      hackathons = allHackathons.filter(h =>
        h.location?.toLowerCase().includes("rajasthan") ||
        h.location?.toLowerCase().includes("jaipur") ||
        h.location?.toLowerCase().includes("udaipur") ||
        h.location?.toLowerCase().includes("jodhpur")
      );
    } else if (lower.includes("delhi")) {
      hackathons = allHackathons.filter(h => h.location?.toLowerCase().includes("delhi"));
    } else if (lower.includes("mumbai")) {
      hackathons = allHackathons.filter(h => h.location?.toLowerCase().includes("mumbai"));
    } else if (lower.includes("bangalore") || lower.includes("bengaluru")) {
      hackathons = allHackathons.filter(h =>
        h.location?.toLowerCase().includes("bangalore") ||
        h.location?.toLowerCase().includes("bengaluru")
      );
    } else if (lower.includes("online") || lower.includes("virtual") || lower.includes("remote")) {
      hackathons = allHackathons.filter(h => h.type === "online");
    }

    // ── Status filter ──
    if (lower.includes("ongoing") || lower.includes("live") || lower.includes("current") || lower.includes("chal rahe") || lower.includes("abhi")) {
      hackathons = hackathons.filter(h => h.status === "open" || h.status === "ongoing");
    } else if (lower.includes("upcoming") || lower.includes("coming") || lower.includes("aane wale")) {
      hackathons = hackathons.filter(h => h.status === "upcoming");
    }

    const result = await handleChat(message, hackathons.slice(0, 8));
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Chat Route Error:", error.message);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
});

module.exports = router;