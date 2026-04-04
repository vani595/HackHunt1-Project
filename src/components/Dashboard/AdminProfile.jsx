import React, { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { Edit2, Save, X, AlertCircle, Users, ShieldCheck, ClipboardList, Activity } from "lucide-react";
import { useRealtimeStream } from "../../hooks/useRealtimeStream";

const AdminProfile = ({ user }) => {
  // ============= STATE HOOKS =============
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    activeOrganizers: 0,
    activeHackathons: 0,
    totalRegistrations: 0
  });
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    adminLevel: "moderator",
    department: ""
  });

  // ============= FUNCTION DEFINITIONS (Before any hooks that use them) =============
  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (!userId || !userRole) {
        throw new Error("User not authenticated");
      }

      const response = await apiClient.fetchProfile(userId, userRole);
      
      if (response) {
        setProfileData({
          firstName: response.firstName || "",
          lastName: response.lastName || "",
          email: response.email || "",
          phoneNumber: response.phoneNumber || "",
          adminLevel: response.adminLevel || "moderator",
          department: response.department || ""
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      // Fall back to localStorage data if API fails
      setProfileData({
        firstName: localStorage.getItem("userName") || "",
        lastName: "",
        email: localStorage.getItem("userEmail") || "",
        phoneNumber: "",
        adminLevel: "moderator",
        department: ""
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const [directoryResponse, hackathonResponse] = await Promise.all([
        apiClient.fetchDirectory(),
        apiClient.getAdminHackathons()
      ]);

      const users = directoryResponse.users || [];
      const hackathons = hackathonResponse.hackathons || [];

      setPlatformStats({
        totalUsers: users.length,
        activeOrganizers: users.filter((item) => item.role === "organizer" && item.status === "active").length,
        activeHackathons: hackathons.filter((item) => item.approvalStatus === "approved").length,
        totalRegistrations: hackathons.reduce((sum, item) => sum + (item.participants || 0), 0)
      });
    } catch (err) {
      console.error("Admin stats fetch error:", err);
    }
  };

  // ============= EFFECT HOOKS =============
  useEffect(() => {
    // Fetch admin profile data from backend
    fetchAdminProfile();
    fetchPlatformStats();
  }, [user]);

  useRealtimeStream({
    "profile:updated": (payload) => {
      const userId = localStorage.getItem("userId");
      if (payload?.userId === userId) {
        fetchAdminProfile();
        setSuccess("Profile refreshed with the latest live changes.");
        setTimeout(() => setSuccess(""), 3000);
      }
    },
    "user:created": fetchPlatformStats,
    "user:deleted": fetchPlatformStats,
    "user:status-updated": fetchPlatformStats,
    "hackathon:created": fetchPlatformStats,
    "hackathon:updated": fetchPlatformStats,
    "hackathon:deleted": fetchPlatformStats,
    "hackathon:approval-updated": fetchPlatformStats,
    "registration:created": fetchPlatformStats,
    "registration:deleted": fetchPlatformStats
  });

  // ============= EVENT HANDLERS =============

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");

      if (!userId || !userRole) {
        throw new Error("User not authenticated");
      }

      // Validate required fields
      if (!profileData.firstName || !profileData.lastName || !profileData.email) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Call API to update profile
      const response = await apiClient.updateProfile(userId, userRole, profileData);

      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-500/10 disabled:cursor-not-allowed disabled:bg-slate-100/90 disabled:text-slate-500 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-rose-400 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-500`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Security Warning */}
      <div className="flex items-start space-x-3 rounded-r-2xl border-l-4 border-indigo-400 bg-indigo-100/80 p-4 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100">
        <AlertCircle className="text-indigo-300 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-medium text-indigo-900 dark:text-indigo-100">Admin Access</h3>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-200">
            You have elevated privileges on this platform. Handle sensitive data responsibly.
          </p>
        </div>
      </div>

      {/* Profile Header */}
      <div className="flex justify-between items-start animate-slideDown">
        <div>
          <h3 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Administrator Profile</h3>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your administrator account information</p>
        </div>
        <button
          onClick={() => {
            if (isEditing) {
              handleSaveProfile();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={loading}
          className="flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2.5 text-white transition duration-200 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400"
        >
          {isEditing ? (
            <>
              <Save size={18} />
              <span>Save Changes</span>
            </>
          ) : (
            <>
              <Edit2 size={18} />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
          {success}
          <button onClick={() => setSuccess("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp">
        {/* First Name */}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={profileData.firstName}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={inputClasses}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={profileData.lastName}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={inputClasses}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={profileData.email}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={inputClasses}
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Phone Number
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={profileData.phoneNumber}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={inputClasses}
          />
        </div>

        {/* Admin Level */}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Admin Level
          </label>
          <select
            name="adminLevel"
            value={profileData.adminLevel}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={inputClasses}
          >
            <option value="super_admin">Super Administrator</option>
            <option value="moderator">Moderator</option>
            <option value="support">Support Staff</option>
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Department
          </label>
          <input
            type="text"
            name="department"
            value={profileData.department}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 gap-4 border-t border-slate-200 pt-8 dark:border-white/10 md:grid-cols-4">
        <div className="animate-fadeIn rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 to-pink-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:border-red-500/20 dark:from-red-500/10 dark:to-slate-900" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-600 transition-all duration-300">{platformStats.totalUsers}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Total Users</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
              <Users size={24} className="text-red-600" />
            </div>
          </div>
        </div>
        <div className="animate-fadeIn rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:border-blue-500/20 dark:from-blue-500/10 dark:to-slate-900" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600 transition-all duration-300">{platformStats.activeOrganizers}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Active Organizers</p>
            </div>
            <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/15">
              <ShieldCheck size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="animate-fadeIn rounded-[24px] border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:border-green-500/20 dark:from-green-500/10 dark:to-slate-900" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-600 transition-all duration-300">{platformStats.activeHackathons}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Active Hackathons</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
              <ClipboardList size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        <div className="animate-fadeIn rounded-[24px] border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg dark:border-purple-500/20 dark:from-purple-500/10 dark:to-slate-900" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-600 transition-all duration-300">{platformStats.totalRegistrations}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Total Registrations</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-500/15">
              <Activity size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="mt-8 border-t border-slate-200 pt-8 dark:border-white/10">
        <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-slate-50">Your Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-3 rounded-2xl bg-green-50 p-3 dark:bg-green-500/10">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm text-slate-700 dark:text-slate-200">Manage Users & Organizers</span>
          </div>
          <div className="flex items-center space-x-3 rounded-2xl bg-green-50 p-3 dark:bg-green-500/10">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm text-slate-700 dark:text-slate-200">Monitor Hackathons</span>
          </div>
          <div className="flex items-center space-x-3 rounded-2xl bg-green-50 p-3 dark:bg-green-500/10">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm text-slate-700 dark:text-slate-200">View Analytics & Reports</span>
          </div>
          <div className="flex items-center space-x-3 rounded-2xl bg-green-50 p-3 dark:bg-green-500/10">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span className="text-sm text-slate-700 dark:text-slate-200">System Configuration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
