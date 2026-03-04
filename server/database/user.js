const { Router } = require("express");
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");

const userRouter = Router();
const Schema = mongoose.Schema;

// ==================== USER SCHEMA ====================
const userSchema = new Schema({
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, default: 'user', enum: ['user'], immutable: true },
    profilePicture: { type: String, default: null },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    joinedHackathons: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    favoriteHackathons: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

// ==================== ORGANIZER SCHEMA ====================
const organizerSchema = new Schema({
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, default: 'organizer', enum: ['organizer'], immutable: true },
    organizationName: { type: String, required: true },
    organizationWebsite: { type: String, default: null },
    organizationLogo: { type: String, default: null },
    bio: { type: String, default: '' },
    hackathonsCreated: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    hackathonsManaged: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    isVerified: { type: Boolean, default: false },
    verificationDocument: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

// ==================== ADMIN SCHEMA ====================
const adminSchema = new Schema({
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, default: 'admin', enum: ['admin'], immutable: true },
    adminLevel: { type: String, enum: ['super_admin', 'moderator', 'support'], default: 'moderator' },
    profilePicture: { type: String, default: null },
    permissions: { type: [String], default: ['view_users', 'view_hackathons'] },
    usersManaged: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    activityLog: { type: [{
            action: String,
            targetId: mongoose.Schema.Types.ObjectId,
            targetType: String,
            timestamp: { type: Date, default: Date.now }
        }],
        default: []
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

const User = mongoose.model("users", userSchema);
const Organizer = mongoose.model("organizers", organizerSchema);
const Admin = mongoose.model("admins", adminSchema);

/* ================= VALIDATION HELPERS ================= */
const validateSignupInput = (email, password, firstName, lastName, phoneNumber, organizationName = null) => {
    const errors = [];
    if (!email || !email.includes("@")) errors.push("Please provide a valid email");
    if (!password || password.length < 8) errors.push("Password must be at least 8 characters");
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) errors.push("Phone number must be 10 digits");
    if (organizationName !== null && !organizationName) errors.push("Organization name is required for organizers");
    return errors;
};

const hashPassword = async (password) => {
    const salt = await bcryptjs.genSalt(10);
    return await bcryptjs.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcryptjs.compare(password, hashedPassword);
};

/* ================= USER SIGNUP ================= */
userRouter.post("/signup", async (req, res) => {
    try {
        const { email, password, firstName, lastName, phoneNumber, role = 'user' } = req.body;
        const validationErrors = validateSignupInput(email, password, firstName, lastName, phoneNumber);
        if (validationErrors.length > 0) return res.status(400).json({ errors: validationErrors });

        const hashedPassword = await hashPassword(password);
        let user;
        // Basic logic for creation
        if (role === 'organizer') {
            user = await Organizer.create({ ...req.body, password: hashedPassword, email: email.toLowerCase() });
        } else if (role === 'admin') {
            user = await Admin.create({ ...req.body, password: hashedPassword, email: email.toLowerCase() });
        } else {
            user = await User.create({ ...req.body, password: hashedPassword, email: email.toLowerCase() });
        }

        res.status(201).json({ message: "User created successfully", userId: user._id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

/* ================= SIGNIN ================= */
userRouter.post("/signin", async (req, res) => {
    try {
        const { email, password, role = 'user' } = req.body;
        let model = (role === 'organizer') ? Organizer : (role === 'admin' ? Admin : User);
        const user = await model.findOne({ email: email.toLowerCase() });
        
        if (!user || !(await comparePassword(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        user.lastLogin = new Date();
        await user.save();
        res.json({ message: "Signin successful", userId: user._id, role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// SABSE IMPORTANT: Export models and router together
module.exports = { User, Organizer, Admin, userRouter };