import React, { useEffect, useState } from "react";

import { apiClient } from "../../api/client";
import { useRealtimeStream } from "../../hooks/useRealtimeStream";

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const adminId = localStorage.getItem("userId");

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");
      if (!adminId) {
        setError("Admin not logged in");
        return;
      }
      const response = await apiClient.getActivityLogs(adminId, { page: currentPage, limit: 30 });
      setLogs(response.logs || []);
    } catch (err) {
      setError(
        err.message || "Failed to load activity log. Please ensure backend server is running."
      );
      console.error("Error loading logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminId) {
      loadLogs();
    }
  }, [adminId, currentPage]);

  useEffect(() => {
    if (!adminId) return undefined;
    const interval = setInterval(() => {
      loadLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, [adminId, currentPage]);

  useRealtimeStream({
    activity: (payload) => {
      const normalized = {
        id: payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        action: payload.action || payload.type || "activity",
        performedBy: payload.performedBy || payload.authorName || "System",
        description: payload.description || payload.message || "",
        status: payload.status || "success",
        timestamp: payload.timestamp || payload.createdAt || new Date().toISOString()
      };
      setLogs((prev) => [normalized, ...prev.slice(0, 29)]);
    }
  });

  if (loading) {
    return <div className="py-16 text-center text-slate-500">Loading activity log...</div>;
  }

  const getActionColor = (action) => {
    if (!action) return "bg-slate-100 text-slate-800";
    if (action.includes("approved")) return "bg-emerald-100 text-emerald-800";
    if (action.includes("rejected")) return "bg-red-100 text-red-800";
    if (action.includes("deleted")) return "bg-red-100 text-red-800";
    if (action.includes("blocked")) return "bg-orange-100 text-orange-800";
    if (action.includes("created") || action.includes("login")) return "bg-blue-100 text-blue-800";
    return "bg-slate-100 text-slate-800";
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] animate-slideUp transition-all duration-300 hover:shadow-[0_18px_80px_rgba(15,23,42,0.12)]">
        <h3 className="text-2xl font-bold text-slate-950 mb-2 animate-fadeIn">Admin Activity Log</h3>
        <p className="text-sm text-slate-600 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          Review the latest platform events, approvals, registrations, and moderation changes.
        </p>

        <div className="mt-6 space-y-3">
          {logs.length > 0 ? (
            logs.map((item, idx) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-4 hover:bg-slate-100 transition-all duration-300 transform hover:translate-x-1 border-l-4 border-transparent hover:border-slate-300 animate-slideUp" style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{item.performedBy || "System"}</p>
                      {item.description && <p className="text-sm text-slate-600">{item.description}</p>}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all duration-300 ${getActionColor(item.action)}`}>
                      {String(item.action || "activity").replace(/_/g, " ")}
                    </span>
                  </div>
                  <time className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleString()}
                  </time>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 animate-fadeIn">
              No activity yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLog;
