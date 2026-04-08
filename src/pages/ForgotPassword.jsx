import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";

const roleConfig = {
  user: {
    title: "Reset User Password",
    subtitle: "Recover access to your HackHunt account",
    accent: "blue",
    backTo: "/login-user"
  },
  organizer: {
    title: "Reset Organizer Password",
    subtitle: "Recover access to your organizer dashboard",
    accent: "amber",
    backTo: "/login-organizer"
  },
  admin: {
    title: "Reset Admin Password",
    subtitle: "Recover your administrator access",
    accent: "red",
    backTo: "/login-admin"
  }
};

const accentClasses = {
  blue: {
    button: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
    link: "text-blue-600 hover:text-blue-700",
    ring: "focus:ring-blue-500"
  },
  amber: {
    button: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
    link: "text-amber-600 hover:text-amber-700",
    ring: "focus:ring-amber-500"
  },
  red: {
    button: "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700",
    link: "text-red-600 hover:text-red-700",
    ring: "focus:ring-red-500"
  }
};

const normalizeFeedbackMessage = (rawMessage, fallbackMessage) => {
  const message = String(rawMessage || "").trim();

  if (!message) {
    return fallbackMessage;
  }

  const legacyOtpMessages = [
    "Email bhej diya gaya hai!",
    "Email bhej diya gaya hai",
    "OTP has been sent to your email.",
    "OTP sent to your email."
  ];

  if (legacyOtpMessages.includes(message)) {
    return "A verification code has been sent to your email address.";
  }

  return message;
};

const normalizeErrorMessage = (rawMessage, fallbackMessage) => {
  const message = String(rawMessage || "").trim();

  if (!message) {
    return fallbackMessage;
  }

  const legacyErrorMessages = {
   
    "User not registered with this email": "No account is registered with this email address.",
    "No account is registered with this email.": "No account is registered with this email address.",
    "Please enter a valid email address.": "Please enter a valid email address.",
    "Unable to send OTP.": "We couldn't send the verification code. Please try again."
  };

  return legacyErrorMessages[message] || message;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = roleConfig[searchParams.get("role")] ? searchParams.get("role") : "user";
  const config = roleConfig[role];
  const accent = accentClasses[config.accent];

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const clearFeedback = () => {
    setMessage("");
    setError("");
    setDevOtp("");
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.requestPasswordReset(email);
      setMessage(
        normalizeFeedbackMessage(
          response.message,
          "A verification code has been sent to your email address."
        )
      );
      if (response.otp) {
        setDevOtp(response.otp);
        setOtp(response.otp);
      }
      setStep(2);
    } catch (err) {
      setError(
        normalizeErrorMessage(
          err.message,
          "We couldn't send the verification code. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const response = await apiClient.verifyResetOtp(email, otp);
      setMessage(response.message || "OTP verified successfully.");
      setStep(3);
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.resetPassword(email, newPassword);
      setMessage(response.message || "Password reset successful.");
      setTimeout(() => {
        navigate(`${config.backTo}?email=${encodeURIComponent(email)}`);
      }, 1200);
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = `w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:outline-none focus:ring-2 ${accent.ring}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
          <p className="mt-2 text-gray-600">{config.subtitle}</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          <span className={step >= 1 ? "text-gray-900" : ""}>Email</span>
          <span>/</span>
          <span className={step >= 2 ? "text-gray-900" : ""}>OTP</span>
          <span>/</span>
          <span className={step >= 3 ? "text-gray-900" : ""}>Reset</span>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {devOtp && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Test OTP: <span className="font-semibold">{devOtp}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${accent.button}`}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={inputClassName}
                placeholder="Enter the 6-digit OTP"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${accent.button}`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClassName}
                placeholder="Enter new password"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClassName}
                placeholder="Re-enter new password"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${accent.button}`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to={config.backTo} className={`font-semibold ${accent.link}`}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
