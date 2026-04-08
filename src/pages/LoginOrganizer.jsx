import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { Eye, EyeOff } from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";

const LoginOrganizer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

      const response = await apiClient.signin(email, password, "organizer");

      if (response.userId) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", response.userId);
        localStorage.setItem("userRole", response.role);
        localStorage.setItem("userName", response.firstName);
        localStorage.setItem("userEmail", response.email);
        navigate("/dashboard/organizer");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      await signOut(auth);

      const response = await fetch("/api/v1/user/google-auth-organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          firstName: firebaseUser.displayName?.split(" ")[0] || "",
          lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
          profilePicture: firebaseUser.photoURL,
          checkOnly: true,
        }),
      });

      const data = await response.json();

      if (response.status === 404 || data.isNewUser) {
        setError("⚠️ No organizer account found! Please sign up first.");
        return;
      }

      if (!response.ok) {
        setError(data.message || "Google login failed.");
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userRole", "organizer");
      localStorage.setItem("userName", data.firstName);
      localStorage.setItem("userEmail", data.email);
      navigate("/dashboard/organizer");
    } catch (err) {
      setError("Google login failed. Please try again.");
      console.error("Google login error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl shadow-lg">⚙️</div>
          <h1 className="text-3xl font-bold text-white">Organizer Login</h1>
          <p className="text-slate-300 mt-2">Manage your hackathons and reach participants</p>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 px-4 mb-5 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {googleLoading ? "Checking..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="organizer@company.com" disabled={loading}
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading}
                className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 text-slate-300">
              <input type="checkbox" className="rounded bg-slate-700 border-slate-600" />
              <span>Remember me</span>
            </label>
            <Link to={`/forgot-password?role=organizer&email=${encodeURIComponent(email)}`}
              className="text-amber-400 hover:text-amber-300 font-medium">
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 transition duration-200 font-semibold mt-6">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link to="/signup-organizer" className="text-amber-400 hover:text-amber-300 font-semibold">
            Sign up here
          </Link>
        </div>
        <div className="mt-2 text-center text-sm text-amber-200">
          <Link to="/" className="hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginOrganizer;