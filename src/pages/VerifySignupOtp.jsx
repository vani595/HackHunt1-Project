import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { apiClient } from "../api/client";

const ROLE_CONFIG = {
  user: {
    backTo: "/signup-user",
    backLabel: "Back to sign up",
    dashboard: "/dashboard/user?section=browse",
    accent: "from-blue-500 to-indigo-600",
    bg: "from-slate-900 via-blue-900 to-slate-900"
  },
  organizer: {
    backTo: "/signup-organizer",
    backLabel: "Back to sign up",
    dashboard: "/dashboard/organizer",
    accent: "from-amber-500 to-orange-600",
    bg: "from-slate-900 via-amber-900 to-slate-900"
  },
  admin: {
    backTo: "/signup-admin",
    backLabel: "Back to sign up",
    dashboard: "/admin",
    accent: "from-indigo-500 to-violet-600",
    bg: "from-slate-700 via-indigo-700 to-slate-700"
  }
};

const RESEND_COOLDOWN_SEC = 30;

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

const VerifySignupOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const role =
    state.role === "organizer" || state.role === "admin" ? state.role : "user";
  const cfg = ROLE_CONFIG[role];
  const email = typeof state.email === "string" ? state.email.trim() : "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email || !isValidEmailFormat(email)) {
      navigate(cfg.backTo, { replace: true });
    }
  }, [email, navigate, cfg.backTo]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const t = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const otpString = digits.join("");

  const focusIndex = useCallback((index) => {
    const el = inputRefs.current[index];
    if (el) el.focus();
  }, []);

  const handleDigitChange = (index, raw) => {
    const v = raw.replace(/\D/g, "").slice(-1);
    setError("");
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && index < 5) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (text.length === 0) return;
    const arr = text.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(arr);
    setError("");
    focusIndex(Math.min(text.length, 5));
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (otpString.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.verifySignupOtp(email, otpString, role);
      if (response.success && response.userId) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", String(response.userId));
        localStorage.setItem("userRole", response.role);
        localStorage.setItem("userName", response.firstName || "");
        localStorage.setItem("userEmail", response.email || email);
        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }
        navigate(cfg.dashboard, { replace: true });
      } else {
        setError("Invalid or expired OTP");
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("429") || msg.toLowerCase().includes("too many")) {
        setError(msg);
      } else {
        setError("Invalid or expired OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError("");
    setResendLoading(true);
    try {
      await apiClient.resendSignupOtp(email, role);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setDigits(["", "", "", "", "", ""]);
      focusIndex(0);
    } catch (err) {
      setError(err.message || "Failed to send OTP, try again");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${cfg.bg}`}>
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <div className="text-center mb-6">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${cfg.accent} text-white text-2xl shadow-lg`}
          >
            ✉️
          </div>
          <h1 className="text-2xl font-bold text-white">Verify your email</h1>
          <p className="text-slate-300 mt-2 text-sm">
            Enter the code we sent to complete registration.
          </p>
          <p className="text-slate-400 mt-3 text-sm break-all">
            We sent a code to <span className="text-slate-200 font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3 text-center">
              Verification code
            </label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otpString.length !== 6}
            className={`w-full bg-gradient-to-r ${cfg.accent} text-white py-2.5 rounded-lg hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition`}
          >
            {loading ? "Verifying…" : "Verify & create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            disabled={resendCooldown > 0 || resendLoading}
            onClick={handleResend}
            className="text-blue-400 hover:text-blue-300 font-medium disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            {resendLoading
              ? "Sending…"
              : resendCooldown > 0
                ? `Resend code (${resendCooldown}s)`
                : "Resend code"}
          </button>
        </p>

        <div className="mt-6 text-center">
          <Link to={cfg.backTo} className="text-sm text-slate-400 hover:text-slate-200">
            {cfg.backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifySignupOtp;
