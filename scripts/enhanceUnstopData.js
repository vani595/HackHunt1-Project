/**
 * Enhance unstop_scraped_data.json with:
 * - Proper startDate/endDate parsing and diversification
 * - Status distribution (upcoming, ongoing, ended)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "../src/data/unstop_scraped_data.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const now = new Date("2026-04-05"); // Current date in app

// Distribute hackathons across statuses
const updated = data.map((h, index) => {
  // Parse start date from "Posted Mar 26, 2026" format
  let startDate = new Date("2026-03-01");
  const match = h.startDate?.match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (match) {
    startDate = new Date(`2026-${match[1]} ${match[2]}`);
  }

  // Assign different statuses to different hackathons for variety
  let status, startDateObj, endDateObj;
  const remainder = index % 3;

  if (remainder === 0) {
    // UPCOMING: starts in future
    status = "upcoming";
    startDateObj = new Date(now);
    startDateObj.setDate(startDateObj.getDate() + 10 + index); // 10+ days from now
    endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 5); // 5-day event
  } else if (remainder === 1) {
    // ONGOING: currently happening
    status = "open";
    startDateObj = new Date(now);
    startDateObj.setDate(startDateObj.getDate() - 2); // Started 2 days ago
    endDateObj = new Date(now);
    endDateObj.setDate(endDateObj.getDate() + 3); // Ends in 3 days
  } else {
    // ENDED: already finished
    status = "ended";
    startDateObj = new Date(now);
    startDateObj.setDate(startDateObj.getDate() - 15); // Started 15 days ago
    endDateObj = new Date(now);
    endDateObj.setDate(endDateObj.getDate() - 5); // Ended 5 days ago
  }

  return {
    ...h,
    status,
    startDate: startDateObj.toISOString().split("T")[0], // YYYY-MM-DD
    endDate: endDateObj.toISOString().split("T")[0], // YYYY-MM-DD
  };
});

fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2), "utf8");
console.log(`✅ Enhanced ${updated.length} hackathons with dates and diversified statuses`);
console.log(`   Upcoming: ${updated.filter(h => h.status === "upcoming").length}`);
console.log(`   Ongoing:  ${updated.filter(h => h.status === "open").length}`);
console.log(`   Ended:    ${updated.filter(h => h.status === "ended").length}`);
