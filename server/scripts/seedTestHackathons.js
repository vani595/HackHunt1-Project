/**
 * Seed test hackathons into MongoDB
 * Usage: node server/scripts/seedTestHackathons.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/hackhunt");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Test hackathons data
const testHackathons = [
  {
    title: "AI Hackathon 2026",
    description: "Build AI powered applications and compete for prizes",
    startDate: new Date("2026-02-01"),
    endDate: new Date("2026-02-10"),
    location: "Online",
    address: "Virtual Event",
    latitude: 20.5937,
    longitude: 78.9629,
    mode: "online",
    prize: "₹5,00,000",
    maxParticipants: 300,
    imageUrl: "https://placehold.co/600x400?text=AI+Hackathon",
    tags: ["AI", "Machine Learning", "Innovation"],
    organizerId: null, // Will be set to a test organizer
    organizerName: "Devpost",
    status: "approved",
    registrationUrl: "https://devpost.com/hackathons"
  },
  {
    title: "Web3 Hackathon",
    description: "Blockchain and Web3 projects - decentralized future",
    startDate: new Date("2026-03-15"),
    endDate: new Date("2026-03-25"),
    location: "Bangalore, Karnataka, India",
    address: "Bangalore, India",
    latitude: 12.9716,
    longitude: 77.5946,
    mode: "in-person",
    prize: "₹3,00,000",
    maxParticipants: 150,
    imageUrl: "https://placehold.co/600x400?text=Web3+Hackathon",
    tags: ["Web3", "Blockchain", "Crypto"],
    organizerId: null,
    organizerName: "HackerEarth",
    status: "approved",
    registrationUrl: "https://hackathon.io"
  },
  {
    title: "Smart India Hackathon 2026",
    description: "Solve real-world problems provided by India's ministries",
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-03-31"),
    location: "India",
    address: "Pan-India Event",
    latitude: 20.5937,
    longitude: 78.9629,
    mode: "hybrid",
    prize: "₹1,00,00,000",
    maxParticipants: 5000,
    imageUrl: "https://placehold.co/600x400?text=SIH+2026",
    tags: ["AI", "IoT", "GovTech", "Social Impact"],
    organizerId: null,
    organizerName: "Government of India",
    status: "approved",
    registrationUrl: "https://www.sih.gov.in"
  },
  {
    title: "DeltaHacks",
    description: "24-hour hackathon for innovative projects",
    startDate: new Date("2026-04-10"),
    endDate: new Date("2026-04-12"),
    location: "Delhi, India",
    address: "Delhi, India",
    latitude: 28.6139,
    longitude: 77.2090,
    mode: "in-person",
    prize: "₹50,00,000",
    maxParticipants: 500,
    imageUrl: "https://placehold.co/600x400?text=DeltaHacks",
    tags: ["Innovation", "Technology", "Hardware"],
    organizerId: null,
    organizerName: "DeltaHacks Org",
    status: "approved",
    registrationUrl: "https://deltahacks.io"
  },
  {
    title: "FinTech Hackathon",
    description: "Build the future of financial technology",
    startDate: new Date("2026-04-20"),
    endDate: new Date("2026-04-27"),
    location: "Mumbai, Maharashtra, India",
    address: "Mumbai, India",
    latitude: 19.0760,
    longitude: 72.8777,
    mode: "hybrid",
    prize: "₹25,00,000",
    maxParticipants: 200,
    imageUrl: "https://placehold.co/600x400?text=FinTech+Hackathon",
    tags: ["FinTech", "Banking", "Payments"],
    organizerId: null,
    organizerName: "FinTech Alliance",
    status: "approved",
    registrationUrl: "https://fintech-hack.com"
  },
  {
    title: "Healthcare Innovation Challenge",
    description: "Use technology to solve healthcare challenges",
    startDate: new Date("2026-05-01"),
    endDate: new Date("2026-05-10"),
    location: "Pune, Maharashtra, India",
    address: "Pune, India",
    latitude: 18.5204,
    longitude: 73.8567,
    mode: "hybrid",
    prize: "₹15,00,000",
    maxParticipants: 100,
    imageUrl: "https://placehold.co/600x400?text=HealthTech",
    tags: ["Healthcare", "Medical Tech", "IoT"],
    organizerId: null,
    organizerName: "Health Tech Foundation",
    status: "approved",
    registrationUrl: "https://healthtech-challenge.com"
  },
  {
    title: "Climate Action Hackathon",
    description: "Build solutions for climate change and sustainability",
    startDate: new Date("2026-05-15"),
    endDate: new Date("2026-05-22"),
    location: "Bangalore, Karnataka, India",
    address: "Bangalore, India",
    latitude: 12.9716,
    longitude: 77.5946,
    mode: "online",
    prize: "₹20,00,000",
    maxParticipants: 250,
    imageUrl: "https://placehold.co/600x400?text=Climate+Action",
    tags: ["Climate", "Sustainability", "Green Tech"],
    organizerId: null,
    organizerName: "Green Hackathon",
    status: "approved",
    registrationUrl: "https://climate-hack.io"
  },
  {
    title: "Gaming & AR Hackathon",
    description: "Create immersive gaming and AR/VR experiences",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-08"),
    location: "Hyderabad, Telangana, India",
    address: "Hyderabad, India",
    latitude: 17.3850,
    longitude: 78.4867,
    mode: "in-person",
    prize: "₹30,00,000",
    maxParticipants: 300,
    imageUrl: "https://placehold.co/600x400?text=Gaming+AR",
    tags: ["Gaming", "AR", "VR", "Unity"],
    organizerId: null,
    organizerName: "Gaming Studios",
    status: "approved",
    registrationUrl: "https://gaming-ar-hack.com"
  },
  {
    title: "Cybersecurity Challenge",
    description: "Test your security skills and find vulnerabilities",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-04-05"),
    location: "Chennai, Tamil Nadu, India",
    address: "Chennai, India",
    latitude: 13.0827,
    longitude: 80.2707,
    mode: "online",
    prize: "₹10,00,000",
    maxParticipants: 150,
    imageUrl: "https://placehold.co/600x400?text=Cybersecurity",
    tags: ["Cybersecurity", "Hacking", "Security"],
    organizerId: null,
    organizerName: "Cyber Defense",
    status: "approved",
    registrationUrl: "https://cyber-hack.io"
  },
  {
    title: "IoT Innovation Summit",
    description: "Build IoT projects for smart cities and homes",
    startDate: new Date("2026-05-20"),
    endDate: new Date("2026-05-27"),
    location: "Noida, Uttar Pradesh, India",
    address: "Noida, India",
    latitude: 28.4744,
    longitude: 77.5040,
    mode: "hybrid",
    prize: "₹18,00,000",
    maxParticipants: 180,
    imageUrl: "https://placehold.co/600x400?text=IoT+Innovation",
    tags: ["IoT", "Smart City", "Hardware"],
    organizerId: null,
    organizerName: "IoT Labs",
    status: "approved",
    registrationUrl: "https://iot-innovation.com"
  }
];

const seedHackathons = async () => {
  try {
    const { Hackathon } = require("../database/hackathon");
    
    // Clear existing hackathons (optional)
    console.log("🧹 Clearing existing hackathons...");
    await Hackathon.deleteMany({});
    console.log("✅ Cleared existing hackathons");

    // Create a test organizer if not exists
    const organizerSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      createdAt: { type: Date, default: Date.now }
    });
    
    const Organizer = mongoose.models.organizers || mongoose.model("organizers", organizerSchema);

    let testOrganizer = await Organizer.findOne({ email: "organizer@test.com" }).catch(() => null);
    if (!testOrganizer) {
      testOrganizer = await Organizer.create({
        name: "Test Organizer",
        email: "organizer@test.com"
      });
      console.log("✅ Created test organizer");
    } else {
      console.log("✅ Using existing test organizer");
    }

    // Add organizer ID to all test hackathons
    const hackathonsWithOrgId = testHackathons.map(h => ({
      ...h,
      organizerId: testOrganizer._id
    }));

    // Insert hackathons
    const inserted = await Hackathon.insertMany(hackathonsWithOrgId);
    console.log(`✅ Successfully seeded ${inserted.length} test hackathons`);
    
    inserted.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.title} (${h.location}) - ${h.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding hackathons:", error.message);
    process.exit(1);
  }
};

// Run the seeder
connectDB().then(() => seedHackathons());
