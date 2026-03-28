import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { isEmailDomainAllowed, allowedEmailDomains } from "../utils/validation";
import { Eye, EyeOff } from "lucide-react";

const SignupOrganizer = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    organizationName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setErrors([]);

    const emailValue = (formData.email || "").trim().toLowerCase();
    if (!isEmailDomainAllowed(emailValue)) {
      setError(`Email must be one of: ${allowedEmailDomains.join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.signup(
        emailValue,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber,
        "organizer",
        formData.organizationName
      );

      if (response.userId) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("userName", formData.firstName);
        localStorage.setItem("userRole", "organizer");
        localStorage.setItem("userEmail", formData.email);
        navigate("/dashboard/organizer");
      }
    } catch (err) {
      const errorMessage = err.message || "Signup failed. Please try again.";
      if (Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setError(errorMessage);
      }
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 py-12 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl shadow-lg">
            ⚙️
          </div>
          <h1 className="text-3xl font-bold text-white">Create Organizer Account</h1>
          <p className="text-slate-300 mt-2">Organize hackathons and manage participants</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm space-y-1">
              {errors.map((err, idx) => (
                <div key={idx}>• {err}</div>
              ))}
            </div>
          )}

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Jane"
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Smith"
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="Your Company/Organization"
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="organizer@company.com"
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Phone Number (10 digits)
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="1234567890"
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Min 8 chars with uppercase, lowercase, number & special char (@$!%*?&)
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 transition duration-200 font-semibold mt-6"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login-organizer" className="text-amber-400 hover:text-amber-300 font-semibold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupOrganizer;
