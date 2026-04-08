import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { isValidEmail } from "../utils/validation";
import { Eye, EyeOff } from "lucide-react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  // Google flow — org name modal
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [googleUser, setGoogleUser] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

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
    if (!isValidEmail(emailValue)) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.sendSignupOtp({
        email: emailValue,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: "organizer",
        organizationName: formData.organizationName,
      });

      if (response.success) {
        navigate("/verify-signup-otp", {
          state: { email: emailValue, role: "organizer" },
        });
      }
    } catch (err) {
      const msg = err.message || "";
      if (
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered") ||
        msg.toLowerCase().includes("exist")
      ) {
        setError("already_exists");
      } else if (Array.isArray(err.errors)) {
        setErrors(err.errors);
      } else {
        setError(msg || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Google se info lo, phir org name modal dikhao
  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await signOut(auth);

      // Check already registered?
      const checkRes = await fetch("/api/v1/user/google-auth-organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, uid: user.uid, checkOnly: true }),
      });
      const checkData = await checkRes.json();

      if (checkRes.ok && !checkData.isNewUser) {
        setError("already_exists");
        return;
      }

      // Store Google user info aur org modal dikhao
      setGoogleUser(user);
      setShowOrgModal(true);
    } catch (err) {
      setError("Google signup failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Step 2: Org name dene ke baad account banao
  const handleOrgSubmit = async () => {
    if (!orgName.trim()) {
      setError("Organization name is required!");
      return;
    }
    setOrgLoading(true);
    try {
      const response = await fetch("/api/v1/user/google-auth-organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleUser.email,
          uid: googleUser.uid,
          firstName: googleUser.displayName?.split(" ")[0] || "Organizer",
          lastName: googleUser.displayName?.split(" ").slice(1).join(" ") || ".",
          profilePicture: googleUser.photoURL,
          organizationName: orgName.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed.");
        setShowOrgModal(false);
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userRole", "organizer");
      localStorage.setItem("userName", data.firstName);
      localStorage.setItem("userEmail", data.email);
      navigate("/dashboard/organizer");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setShowOrgModal(false);
    } finally {
      setOrgLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 py-12 px-4">

      {/* Organization Name Modal */}
      {showOrgModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#1e293b", border: "1px solid #334155",
            borderRadius: "16px", padding: "32px", width: "380px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)"
          }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏢</div>
              <h2 style={{ color: "white", fontSize: "20px", fontWeight: 700 }}>One More Step!</h2>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "6px" }}>
                Enter your organization name to complete signup
              </p>
            </div>

            <label style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Organization Name *
            </label>
            <input
              type="text"
              placeholder="Your Company / College / Organization"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOrgSubmit()}
              style={{
                width: "100%", marginTop: "8px", padding: "10px 14px",
                background: "#0f172a", border: "1px solid #475569",
                borderRadius: "10px", color: "white", fontSize: "14px",
                outline: "none", boxSizing: "border-box", marginBottom: "16px"
              }}
            />

            <button
              onClick={handleOrgSubmit}
              disabled={orgLoading}
              style={{
                width: "100%", padding: "12px",
                background: "linear-gradient(135deg, #f59e0b, #ea580c)",
                border: "none", borderRadius: "10px", color: "white",
                fontWeight: 700, fontSize: "14px", cursor: "pointer",
                opacity: orgLoading ? 0.6 : 1, marginBottom: "10px"
              }}
            >
              {orgLoading ? "Creating Account..." : "Complete Signup →"}
            </button>

            <button
              onClick={() => { setShowOrgModal(false); setOrgName(""); }}
              style={{
                width: "100%", padding: "10px", background: "none",
                border: "1px solid #334155", borderRadius: "10px",
                color: "#94a3b8", fontSize: "13px", cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl shadow-lg">⚙️</div>
          <h1 className="text-3xl font-bold text-white">Create Organizer Account</h1>
          <p className="text-slate-300 mt-2">Organize hackathons and manage participants</p>
        </div>

        {/* Google Signup Button */}
        <button
          onClick={handleGoogleSignup}
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
            {googleLoading ? "Signing up..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Already Exists Error */}
          {error === "already_exists" && (
            <div className="bg-yellow-900 bg-opacity-40 border border-yellow-500 text-yellow-200 px-4 py-3 rounded-lg text-sm">
              ⚠️ This email is already registered!{" "}
              <Link to="/login-organizer" className="underline font-semibold text-yellow-300 hover:text-yellow-100">
                Please login instead →
              </Link>
            </div>
          )}
          {error && error !== "already_exists" && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {errors.length > 0 && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm space-y-1">
              {errors.map((err, idx) => <div key={idx}>• {err}</div>)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">First Name</label>
              <input type="text" name="firstName" value={formData.firstName}
                onChange={handleChange} placeholder="Jane" disabled={loading}
                className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName}
                onChange={handleChange} placeholder="Smith" disabled={loading}
                className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Organization Name *</label>
            <input type="text" name="organizationName" value={formData.organizationName}
              onChange={handleChange} placeholder="Your Company/Organization" disabled={loading}
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Email Address</label>
            <input type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="organizer@company.com" disabled={loading}
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Phone Number (10 digits)</label>
            <input type="tel" name="phoneNumber" value={formData.phoneNumber}
              onChange={handleChange} placeholder="1234567890" disabled={loading}
              className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} name="password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••••" disabled={loading}
                className="w-full px-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Min 8 chars with uppercase, lowercase, number & special char (@$!%*?&)</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2.5 rounded-lg hover:from-amber-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 transition font-semibold mt-2">
            {loading ? "Sending code..." : "Send Verification Code"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login-organizer" className="text-amber-400 hover:text-amber-300 font-semibold">Sign in here</Link>
        </div>
        <div className="mt-2 text-center text-sm text-amber-200">
          <Link to="/" className="hover:text-white">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupOrganizer;