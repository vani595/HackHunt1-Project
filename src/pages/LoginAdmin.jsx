import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { Eye, EyeOff } from "lucide-react";

const LoginAdmin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      const response = await apiClient.signin(email, password, "admin");
      
      if (response.userId) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("userRole", response.role);
        localStorage.setItem("userName", response.firstName);
        localStorage.setItem("userEmail", response.email);

        navigate("/admin");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-indigo-700 to-slate-700">
      <div className="w-full max-w-md bg-slate-600 rounded-2xl shadow-2xl p-8 border border-slate-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl shadow-lg">
            🛡️
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Login</h1>
          <p className="text-slate-300 mt-2">System administrator access only</p>
        </div>

        {/* Security Warning */}
        <div className="bg-indigo-700 bg-opacity-40 border border-indigo-400 rounded-lg p-3 mb-6">
          <p className="text-sm text-indigo-100">
            ⚠️ <strong>Restricted Access:</strong> This area is for administrators only. Unauthorized access is prohibited.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-indigo-700 bg-opacity-40 border border-indigo-400 text-indigo-100 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-100 mb-2">
              Admin Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hackhunt.com"
              className="w-full px-4 py-2 border border-slate-400 rounded-lg bg-slate-500 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-100 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-slate-400 rounded-lg bg-slate-500 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-300 hover:text-slate-100"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 text-slate-100">
              <input type="checkbox" className="rounded bg-slate-500 border-slate-400" />
              <span>Remember me</span>
            </label>
            <Link to={`/forgot-password?role=admin&email=${encodeURIComponent(email)}`} className="text-indigo-300 hover:text-indigo-200 font-medium">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition duration-200 font-semibold mt-6"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginAdmin;
