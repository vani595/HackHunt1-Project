const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
require('dotenv').config(); 

// Routes import karo
const forgotPasswordRoutes = require('./routes/forgotPassword');

const app = express();

// ==================== Middleware ====================
app.use(cors());
// JSON data padhne ke liye ye do lines zaroori hain
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes Register ====================
// Iska matlab URL hoga: http://localhost:5000/api/forgot-password
app.use('/api/forgot-password', forgotPasswordRoutes);

// ==================== MongoDB Connection ====================
mongoose.connect("mongodb://127.0.0.1:27017/project1")
.then(() => {
    console.log("✅ MongoDB connected (Local Compass)");
})
.catch((err) => {
    console.error("❌ MongoDB connection error:", err);
});

// ==================== Server Start ====================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server chal raha hai port: ${PORT} par`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api/forgot-password`);
});