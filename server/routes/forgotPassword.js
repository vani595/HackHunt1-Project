const express = require('express');
const router = express.Router();
const { User, Organizer, Admin } = require('../database/User'); 
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');

// ==========================================
// 1. Forgot Password (OTP Bhejega)
// ==========================================
router.post('/', async (req, res) => {
    console.log(">>> 🚀 STEP 1: API Hit Hui Hai! Body:", req.body);
    const { email } = req.body;

    try {
        // 1. Database Check
        console.log(">>> 🔍 STEP 2: Database mein email dhoond raha hoon...");
        let user = await User.findOne({ email }) || 
                   await Organizer.findOne({ email }) || 
                   await Admin.findOne({ email });

        if (!user) {
            console.log(">>> ❌ STEP 3: User nahi mila DB mein!");
            return res.status(404).json({ message: "User is email se register nahi hai!" });
        }
        console.log(">>> ✅ STEP 3: User mil gaya:", user.email);

        // 2. OTP Generate
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 
        
        console.log(">>> 💾 STEP 4: OTP DB mein save kar raha hoon...");
        await user.save();
        console.log(">>> ✅ STEP 4: OTP Saved Successfully!");

        // 3. Email Sending
        console.log(">>> 📧 STEP 5: Nodemailer ko call kar raha hoon...");
        const message = `Tera reset password OTP hai: ${otp}. Ye 10 minute mein expire ho jayega.`;
        
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            message
        });

        console.log(">>> 🎊 STEP 6: Sab sahi raha! Email nikal gaya.");
        res.status(200).json({ message: "Email bhej diya gaya hai!" });

    } catch (error) {
        console.log(">>> 🧨 ERROR DETECTED:");
        console.error(error); // Ye terminal mein poora error dikhayega
        res.status(500).json({ message: "Kuch gadbad ho gayi, firse try karo." });
    }
});

// ==========================================
// 2. Verify OTP
// ==========================================
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        let user = await User.findOne({ email }) || await Organizer.findOne({ email }) || await Admin.findOne({ email });
        if (!user || user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "OTP galat hai ya expire ho gaya hai!" });
        }
        res.status(200).json({ message: "OTP sahi hai! Password reset kar sakte ho." });
    } catch (error) {
        res.status(500).json({ message: "Kuch gadbad ho gayi." });
    }
});

// ==========================================
// 3. Reset Password
// ==========================================
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        let user = await User.findOne({ email }) || await Organizer.findOne({ email }) || await Admin.findOne({ email });
        if (!user) return res.status(404).json({ message: "User nahi mila!" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordOTP = null;
        user.resetPasswordExpires = null;
        await user.save();
        res.status(200).json({ message: "Password successfully change ho gaya!" });
    } catch (error) {
        res.status(500).json({ message: "Kuch gadbad ho gayi." });
    }
});

module.exports = router;