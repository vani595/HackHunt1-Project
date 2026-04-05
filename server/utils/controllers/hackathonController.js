const { Organizer, Admin, User } = require("../../database/user");
const {
  Hackathon,
  HackathonRegistration,
  buildHackathonSummary,
  calculateHackathonStats,
  fetchHackathons
} = require("../../services/hackathonService");
const { broadcast, createActivity } = require("../../utils/realtimeHub");
const mongoose = require("mongoose");
const { getLiveScrapedHackathons } = require("../scrapers/liveHackathonScraper");

const getLiveHackathons = async (req, res) => {
  try {
    const forceRefresh =
      req.query.refresh === "1" ||
      req.query.refresh === "true" ||
      req.query.nocache === "1";
    const body = await getLiveScrapedHackathons({ forceRefresh });
    res.json(body);
  } catch (error) {
    console.error("❌ Error in getLiveHackathons:", error.message);
    // Return 200 with empty hackathons instead of 500 error
    // This allows the app to continue with platform hackathons
    res.status(200).json({
      hackathons: [],
      cachedAt: new Date().toISOString(),
      sources: { Devpost: "error", Unstop: "error", DoraHacks: "error" },
      ttlMs: 30 * 60 * 1000,
      fromCache: false,
      error: "Failed to fetch live hackathons - using empty fallback",
      errorDetails: error.message
    });
  }
};

const getHackathons = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        hackathons: [],
        total: 0,
        databaseOffline: true
      });
    }

    const { search = "", status = "", type = "" } = req.query;
    const hackathons = await fetchHackathons({
      search,
      status,
      type,
      approvalStatus: "approved"
    });

    res.json({
      hackathons,
      total: hackathons.length
    });
  } catch (error) {
    console.error("Error in getHackathons:", error.message);
    res.status(500).json({
      message: "Failed to fetch hackathons"
    });
  }
};

const getHackathonStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        total: 0,
        upcoming: 0,
        ongoing: 0,
        ended: 0,
        totalPrize: "$0",
        databaseOffline: true
      });
    }

    const hackathons = await fetchHackathons({ approvalStatus: "approved" });
    const stats = calculateHackathonStats(hackathons);
    res.json(stats);
  } catch (error) {
    console.error("Error in getHackathonStats:", error.message);
    res.status(500).json({
      message: "Failed to fetch hackathon stats"
    });
  }
};

const getHackathonById = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found." });
    }

    const summary = await buildHackathonSummary(hackathon);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch hackathon." });
  }
};

const getOrganizerHackathons = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const hackathons = await fetchHackathons({
      organizerId,
      approvalStatus: ""
    });

    res.json({
      hackathons,
      total: hackathons.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch organizer hackathons." });
  }
};

const getAdminHackathons = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        hackathons: [],
        total: 0,
        databaseOffline: true
      });
    }

    const { status = "" } = req.query;
    const query = status ? { status } : {};
    const hackathons = await Hackathon.find(query).sort({ createdAt: -1 });
    const summaries = await Promise.all(
      hackathons.map((hackathon) => buildHackathonSummary(hackathon))
    );

    res.json({
      hackathons: summaries,
      total: summaries.length
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin hackathons." });
  }
};

const createHackathon = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      address,
      latitude,
      longitude,
      mode,
      prize,
      maxParticipants,
      imageUrl,
      tags,
      registrationUrl,
      organizerId
    } = req.body;

    if (!title || !description || !startDate || !endDate || !location || !organizerId) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found." });
    }

    const hackathon = await Hackathon.create({
      title,
      description,
      startDate,
      endDate,
      location,
      address: address || "",
      latitude:
        latitude === undefined || latitude === null || latitude === ""
          ? null
          : Number.isFinite(Number(latitude))
            ? Number(latitude)
            : null,
      longitude:
        longitude === undefined || longitude === null || longitude === ""
          ? null
          : Number.isFinite(Number(longitude))
            ? Number(longitude)
            : null,
      mode: mode || "online",
      prize,
      maxParticipants: Number(maxParticipants) || 100,
      imageUrl,
      tags: Array.isArray(tags)
        ? tags
        : String(tags || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
      registrationUrl,
      organizerId: organizer._id,
      organizerName: organizer.organizationName || `${organizer.firstName} ${organizer.lastName}`.trim()
    });

    organizer.hackathonsCreated = [...(organizer.hackathonsCreated || []), hackathon._id];
    if (!organizer.hackathonsManaged?.includes(hackathon._id)) {
      organizer.hackathonsManaged = [...(organizer.hackathonsManaged || []), hackathon._id];
    }
    await organizer.save();

    const summary = await buildHackathonSummary(hackathon, 0);
    broadcast("hackathon:created", summary);
    createActivity({
      type: "hackathon_submitted",
      authorId: String(organizer._id),
      authorName: organizer.organizationName || `${organizer.firstName} ${organizer.lastName}`.trim(),
      authorRole: "organizer",
      message: `${summary.title} was submitted for admin approval.`
    });

    res.status(201).json({
      message: "Hackathon submitted for approval.",
      hackathon: summary
    });
  } catch (error) {
    console.error("Create hackathon error:", error);
    res.status(500).json({ message: "Failed to create hackathon." });
  }
};

const updateHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizerId } = req.body;
    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found." });
    }

    if (String(hackathon.organizerId) !== String(organizerId)) {
      return res.status(403).json({ message: "You can only edit your own hackathons." });
    }

    const editableFields = [
      "title",
      "description",
      "startDate",
      "endDate",
      "location",
      "address",
      "latitude",
      "longitude",
      "mode",
      "prize",
      "maxParticipants",
      "imageUrl",
      "registrationUrl"
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "latitude" || field === "longitude") {
          const numeric = Number(req.body[field]);
          hackathon[field] =
            req.body[field] === null ||
            req.body[field] === "" ||
            !Number.isFinite(numeric)
              ? null
              : numeric;
        } else {
          hackathon[field] = req.body[field];
        }
      }
    });

    if (req.body.tags !== undefined) {
      hackathon.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : String(req.body.tags || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    hackathon.status = "pending";
    hackathon.approvedAt = null;
    hackathon.approvedBy = null;
    hackathon.rejectionReason = "";
    await hackathon.save();

    const summary = await buildHackathonSummary(hackathon);
    broadcast("hackathon:updated", summary);
    createActivity({
      type: "hackathon_updated",
      authorId: String(hackathon.organizerId),
      authorName: hackathon.organizerName,
      authorRole: "organizer",
      message: `${summary.title} was updated and sent back for approval.`
    });

    res.json({
      message: "Hackathon updated successfully.",
      hackathon: summary
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update hackathon." });
  }
};

const deleteHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizerId } = req.body;
    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found." });
    }

    if (String(hackathon.organizerId) !== String(organizerId)) {
      return res.status(403).json({ message: "You can only delete your own hackathons." });
    }

    await HackathonRegistration.deleteMany({ hackathonId: hackathon._id });
    await Hackathon.findByIdAndDelete(id);

    broadcast("hackathon:deleted", { hackathonId: id });
    createActivity({
      type: "hackathon_deleted",
      authorId: organizerId,
      authorName: hackathon.organizerName,
      authorRole: "organizer",
      message: `${hackathon.title} was removed from the platform.`
    });

    res.json({ message: "Hackathon deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete hackathon." });
  }
};

const updateHackathonApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminId, rejectionReason = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid approval status." });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const hackathon = await Hackathon.findById(id);
    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found." });
    }

    hackathon.status = status;
    hackathon.approvedBy = admin._id;
    hackathon.approvedAt = new Date();
    hackathon.rejectionReason = status === "rejected" ? rejectionReason : "";
    await hackathon.save();

    const summary = await buildHackathonSummary(hackathon);
    broadcast("hackathon:approval-updated", summary);
    createActivity({
      type: "hackathon_approval",
      authorId: String(admin._id),
      authorName: `${admin.firstName} ${admin.lastName}`.trim(),
      authorRole: "admin",
      message:
        status === "approved"
          ? `${summary.title} was approved and is now visible to users.`
          : `${summary.title} was rejected by admin review.`
    });

    res.json({
      message:
        status === "approved"
          ? "Hackathon approved successfully."
          : "Hackathon rejected successfully.",
      hackathon: summary
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update hackathon approval." });
  }
};

const getUserRegistrations = async (req, res) => {
  try {
    const { userId } = req.params;
    const registrations = await HackathonRegistration.find({ userId }).sort({ createdAt: -1 }).lean();
    const hackathonIds = registrations.map((item) => item.hackathonId);
    const hackathons = await Hackathon.find({ _id: { $in: hackathonIds } }).lean();
    const hackathonMap = new Map(hackathons.map((item) => [String(item._id), item]));

    const items = registrations
      .map((registration) => {
        const hackathon = hackathonMap.get(String(registration.hackathonId));
        if (!hackathon) return null;
        const summaryStatus = new Date(hackathon.startDate) <= new Date() ? "in_progress" : "registered";
        return {
          _id: String(registration._id),
          hackathonId: String(hackathon._id),
          hackathonName: hackathon.title,
          registrationDate: registration.createdAt,
          status: registration.status === "registered" ? summaryStatus : registration.status,
          startDate: hackathon.startDate,
          endDate: hackathon.endDate,
          teamName: registration.teamName || "Solo Builder",
          teamMembers: registration.teamMembers || 1,
          location: hackathon.location
        };
      })
      .filter(Boolean);

    res.json({
      registrations: items
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch registrations." });
  }
};

const registerForHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, teamName = "", teamMembers = 1 } = req.body;
    const user = await User.findById(userId);
    const hackathon = await Hackathon.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!hackathon || hackathon.status !== "approved") {
      return res.status(404).json({ message: "Hackathon is not available for registration." });
    }

    const existing = await HackathonRegistration.findOne({
      hackathonId: hackathon._id,
      userId: user._id
    });

    if (existing) {
      return res.status(409).json({ message: "You are already registered for this hackathon." });
    }

    const totalRegistrations = await HackathonRegistration.countDocuments({
      hackathonId: hackathon._id
    });

    if (totalRegistrations >= hackathon.maxParticipants) {
      return res.status(400).json({ message: "This hackathon is already full." });
    }

    const registration = await HackathonRegistration.create({
      hackathonId: hackathon._id,
      userId: user._id,
      teamName,
      teamMembers: Number(teamMembers) || 1
    });

    if (!user.joinedHackathons?.includes(hackathon._id)) {
      user.joinedHackathons = [...(user.joinedHackathons || []), hackathon._id];
      await user.save();
    }

    broadcast("registration:created", {
      hackathonId: String(hackathon._id),
      userId: String(user._id)
    });
    createActivity({
      type: "registration_created",
      authorId: String(user._id),
      authorName: `${user.firstName} ${user.lastName}`.trim(),
      authorRole: "user",
      message: `${user.firstName} registered for ${hackathon.title}.`
    });

    res.status(201).json({
      message: "Registered successfully.",
      registrationId: String(registration._id)
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register for hackathon." });
  }
};

const unregisterFromHackathon = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { userId, hackathonId } = req.body || {};
    let registration = null;

    if (mongoose.Types.ObjectId.isValid(registrationId)) {
      registration = await HackathonRegistration.findById(registrationId);
    }

    if (!registration && userId) {
      const targetHackathonId = hackathonId || registrationId;

      if (mongoose.Types.ObjectId.isValid(targetHackathonId)) {
        registration = await HackathonRegistration.findOne({
          userId,
          hackathonId: targetHackathonId
        });
      }
    }

    if (!registration) {
      return res.status(404).json({ message: "Registration not found." });
    }

    const [user, hackathon] = await Promise.all([
      User.findById(registration.userId),
      Hackathon.findById(registration.hackathonId)
    ]);

    await HackathonRegistration.findByIdAndDelete(registration._id);

    if (user) {
      user.joinedHackathons = (user.joinedHackathons || []).filter(
        (item) => String(item) !== String(registration.hackathonId)
      );
      await user.save();
    }

    broadcast("registration:deleted", {
      hackathonId: String(registration.hackathonId),
      userId: String(registration.userId),
      registrationId: String(registration._id)
    });
    if (user && hackathon) {
      createActivity({
        type: "registration_deleted",
        authorId: String(user._id),
        authorName: `${user.firstName} ${user.lastName}`.trim(),
        authorRole: "user",
        message: `${user.firstName} unregistered from ${hackathon.title}.`
      });
    }

    res.json({
      message: "Unregistered successfully."
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to unregister." });
  }
};

module.exports = {
  createHackathon,
  deleteHackathon,
  getAdminHackathons,
  getHackathonById,
  getHackathons,
  getLiveHackathons,
  getHackathonStats,
  getOrganizerHackathons,
  getUserRegistrations,
  registerForHackathon,
  unregisterFromHackathon,
  updateHackathon,
  updateHackathonApproval
};
