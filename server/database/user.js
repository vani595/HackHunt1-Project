const { Router } = require("express");
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const { broadcast, createActivity } = require("../utils/realtimeHub");
const { isEmailDomainAllowed, allowedEmailDomains } = require("../utils/validation");

const userRouter = Router();
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, default: "user", enum: ["user"], immutable: true },
    profilePicture: { type: String, default: null },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    joinedHackathons: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    favoriteHackathons: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

const organizerSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, default: "organizer", enum: ["organizer"], immutable: true },
    organizationName: { type: String, required: true },
    organizationWebsite: { type: String, default: null },
    organizationLogo: { type: String, default: null },
    bio: { type: String, default: "" },
    hackathonsCreated: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    hackathonsManaged: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    isVerified: { type: Boolean, default: false },
    verificationDocument: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

const adminSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, default: "" },
    role: { type: String, default: "admin", enum: ["admin"], immutable: true },
    adminLevel: {
      type: String,
      enum: ["super_admin", "moderator", "support"],
      default: "moderator"
    },
    department: { type: String, default: "" },
    profilePicture: { type: String, default: null },
    permissions: { type: [String], default: ["view_users", "view_hackathons"] },
    usersManaged: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    activityLog: {
      type: [
        {
          action: String,
          targetId: mongoose.Schema.Types.ObjectId,
          targetType: String,
          timestamp: { type: Date, default: Date.now }
        }
      ],
      default: []
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
  },
  { timestamps: true }
);

const User = mongoose.models.users || mongoose.model("users", userSchema);
const Organizer =
  mongoose.models.organizers || mongoose.model("organizers", organizerSchema);
const Admin = mongoose.models.admins || mongoose.model("admins", adminSchema);

const getModelForRole = (role = "user") => {
  if (role === "organizer") return Organizer;
  if (role === "admin") return Admin;
  return User;
};

const validateSignupInput = (
  email,
  password,
  firstName,
  lastName,
  phoneNumber,
  organizationName = null
) => {
  const errors = [];
  const normalizedPhoneNumber = String(phoneNumber || "").replace(/\D/g, "");

  if (!email || !/^[^\s@]+@gmail\.com$/i.test(email.trim())) {
    errors.push("Please provide a valid @gmail.com email address");
  }
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!firstName) errors.push("First name is required");
  if (!lastName) errors.push("Last name is required");
  if (!normalizedPhoneNumber || !/^(\d{10}|0\d{10}|91\d{10})$/.test(normalizedPhoneNumber)) {
    errors.push("Phone number must be 10 digits, or include a leading 0 / 91");
  }
  if (organizationName !== null && !organizationName) {
    errors.push("Organization name is required for organizers");
  }

  return errors;
};

const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcryptjs.compare(password, hashedPassword);
};

userRouter.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role = "user" } =
      req.body;
    const validationErrors = validateSignupInput(
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role === "organizer" ? req.body.organizationName : null
    );

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const model = getModelForRole(role);
    const normalizedEmail = email.toLowerCase();
    const normalizedPhoneNumber = String(phoneNumber).replace(/\D/g, "");
    const existingUser = await model.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await hashPassword(password);
    const user = await model.create({
      ...req.body,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
      role: user.role,
      firstName: user.firstName,
      email: user.email
    });

    broadcast("user:created", {
      userId: String(user._id),
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    });

    createActivity({
      type: `${user.role}_signup`,
      authorId: String(user._id),
      authorName: `${user.firstName} ${user.lastName}`.trim(),
      authorRole: user.role,
      message: `${user.firstName} joined the platform as ${user.role}.`,
      targetId: String(user._id),
      targetType: user.role
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const model = getModelForRole(role);
    const user = await model.findOne({ email: email.toLowerCase() });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLogin = new Date();
    await user.save();

    broadcast("user:signed-in", {
      userId: String(user._id),
      role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      timestamp: user.lastLogin
    });

    createActivity({
      type: `${role}_login`,
      authorId: String(user._id),
      authorName: `${user.firstName} ${user.lastName}`.trim(),
      authorRole: role,
      message: `${user.firstName} signed in as ${role}.`,
      targetId: String(user._id),
      targetType: role,
      timestamp: user.lastLogin
    });

    res.json({
      message: "Signin successful",
      userId: user._id,
      role,
      firstName: user.firstName,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get("/profile/:userId/:role", async (req, res) => {
  try {
    const { userId, role } = req.params;
    const model = getModelForRole(role);
    const user = await model.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get("/directory", async (req, res) => {
  try {
    const [users, organizers, admins] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }),
      Organizer.find().select("-password").sort({ createdAt: -1 }),
      Admin.find().select("-password").sort({ createdAt: -1 })
    ]);

    const directory = [...users, ...organizers, ...admins]
      .map((account) => ({
        id: String(account._id),
        name: `${account.firstName || ""} ${account.lastName || ""}`.trim(),
        email: account.email,
        role: account.role,
        status: account.isActive ? "active" : "inactive",
        joinDate: account.createdAt,
        hackathonsJoined: Array.isArray(account.joinedHackathons)
          ? account.joinedHackathons.length
          : 0,
        registrations: Array.isArray(account.joinedHackathons)
          ? account.joinedHackathons.length
          : 0,
        hackathonsCreated: Array.isArray(account.hackathonsCreated)
          ? account.hackathonsCreated.length
          : 0,
        participants: Array.isArray(account.hackathonsManaged)
          ? account.hackathonsManaged.length
          : 0,
        organizationName: account.organizationName || "",
        lastUpdated: account.updatedAt
      }))
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());

    res.json({
      users: directory
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

userRouter.patch("/directory/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = "user", isActive } = req.body;
    const model = getModelForRole(role);

    const updatedUser = await model
      .findByIdAndUpdate(
        userId,
        { isActive: Boolean(isActive) },
        { new: true, runValidators: true }
      )
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    broadcast("user:status-updated", {
      userId: String(updatedUser._id),
      role: updatedUser.role,
      isActive: updatedUser.isActive
    });

    createActivity({
      type: "user_status_changed",
      authorId: String(updatedUser._id),
      authorName: `${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`.trim() || updatedUser.email,
      authorRole: updatedUser.role,
      message: `${updatedUser.firstName || "A user"} is now ${updatedUser.isActive ? "active" : "inactive"}.`
    });

    return res.json({
      message: "User status updated successfully.",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user status.", error: error.message });
  }
});

userRouter.delete("/directory/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = "user" } = req.body;
    const model = getModelForRole(role);
    const deletedUser = await model.findByIdAndDelete(userId).select("-password");

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    broadcast("user:deleted", {
      userId: String(deletedUser._id),
      role: deletedUser.role
    });

    createActivity({
      type: "user_deleted",
      authorId: String(deletedUser._id),
      authorName: `${deletedUser.firstName || ""} ${deletedUser.lastName || ""}`.trim() || deletedUser.email,
      authorRole: deletedUser.role,
      message: `${deletedUser.firstName || "A user"} was removed from the platform.`
    });

    return res.json({
      message: "User deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user.", error: error.message });
  }
});

userRouter.put("/profile/:userId/:role", async (req, res) => {
  try {
    const { userId, role } = req.params;
    const model = getModelForRole(role);
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "profilePicture",
      "bio",
      "skills",
      "adminLevel",
      "department",
      "organizationName",
      "organizationWebsite",
      "organizationLogo"
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const user = await model
      .findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true
      })
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    broadcast("profile:updated", {
      userId: String(user._id),
      role: user.role,
      profile: user
    });

    createActivity({
      type: "profile_updated",
      authorId: String(user._id),
      authorName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
      authorRole: user.role,
      message: `${user.firstName || "A user"} updated their profile.`
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { User, Organizer, Admin, userRouter };
