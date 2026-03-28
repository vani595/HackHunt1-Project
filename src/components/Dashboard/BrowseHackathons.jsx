import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Calendar,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Users,
  Trophy,
  Globe
} from "lucide-react";

// IMPORT YOUR LOCAL JSON DATA HERE
import mockHackathons from "../../data/unstop_scraped_data.json";

const getStatusTone = (status) => {
  if (status === "ongoing") return "bg-emerald-500/20 text-emerald-100 border-emerald-500/30";
  if (status === "ended") return "bg-slate-800/60 text-slate-300 border-slate-600/50";
  if (status === "upcoming") return "bg-blue-500/20 text-blue-100 border-blue-500/30";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const getModeIcon = (mode) => {
  if (mode === "online") return <Globe size={14} className="mr-1" />;
  if (mode === "in-person") return <MapPin size={14} className="mr-1" />;
  return <Sparkles size={14} className="mr-1" />;
};

// FIXED: Advanced Status Parser (Same as Map)
const getHackathonStatus = (hackathon) => {
  try {
    const cleanStartDateStr = (hackathon.startDate || "").replace("Posted ", "").trim();
    const start = new Date(cleanStartDateStr);
    const end = hackathon.endDate ? new Date(hackathon.endDate) : new Date(start.getTime() + (3 * 24 * 60 * 60 * 1000));
    const now = new Date();

    if (!isNaN(end.getTime()) && end < now) return "ended";
    if (!isNaN(start.getTime()) && start > now) return "upcoming";
    if (!isNaN(start.getTime()) && start <= now && end >= now) return "ongoing";
  } catch (e) {}
  
  const normalized = String(hackathon?.status || "").toLowerCase();
  if (normalized === "open" || normalized === "active") return "ongoing";
  return "ended";
};

const BrowseHackathons = ({ user, initialSearchTerm = "" }) => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const formattedMockData = mockHackathons.map((h) => ({
        ...h,
        _id: h.id, 
        mode: h.type, 
        organizerName: h.organizer, 
        prize: h.totalPrize,
        // Calculate standard status immediately
        calculatedStatus: getHackathonStatus(h) 
      }));

      setHackathons(formattedMockData);
    } catch (err) {
      console.error("Error loading JSON data:", err);
      setError("Failed to load hackathons from the JSON file.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (typeof initialSearchTerm === "string" && initialSearchTerm.trim()) {
      setSearchTerm(initialSearchTerm.trim());
    }
  }, [initialSearchTerm]);

  // FIXED: Bulletproof Filter Logic
  const filteredHackathons = useMemo(() => {
    return hackathons.filter((hackathon) => {
      // 1. Search Logic (Title, Description, Organizer, Location)
      const searchTarget = `
        ${hackathon.title || ""} 
        ${hackathon.description || ""} 
        ${hackathon.organizerName || ""} 
        ${hackathon.location || ""}
      `.toLowerCase();
      
      const matchesSearch = !searchTerm || searchTarget.includes(searchTerm.toLowerCase().trim());

      // 2. Status Logic
      const matchesStatus = filterStatus === "all" || hackathon.calculatedStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, hackathons, searchTerm]);

  // Handle direct redirect for "Register" button
  const handleRegister = (hackathon) => {
    if (hackathon.registrationUrl) {
      window.open(hackathon.registrationUrl, '_blank');
    } else {
      setError("Could not find a registration URL for this hackathon.");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              <Sparkles size={14} />
              Live Discovery
            </div>
            <h3 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950">
              Explore Premium Hackathons
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Discover cutting-edge events, compete with the best, and build the future.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Total Events</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{hackathons.length}</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Active Events</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">
                {hackathons.filter((item) => item.calculatedStatus === "ongoing").length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, or organizer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500">
              <Filter size={16} />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition cursor-pointer focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid of Advanced Cards */}
      {filteredHackathons.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {filteredHackathons.map((hackathon, index) => {
            const isEnded = hackathon.calculatedStatus === "ended";

            return (
              <article
                key={hackathon._id}
                className="group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(79,70,229,0.15)]"
                style={{ animation: `feature-fade-up 0.55s ease-out ${index * 0.06}s both` }}
              >
                {/* Advanced Image Header */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                  {hackathon.imageUrl ? (
                    <img
                      src={hackathon.imageUrl}
                      alt={hackathon.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-violet-500 to-fuchsia-600" />
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
                  
                  {/* Floating Badges inside Image */}
                  <div className="absolute left-5 top-5 flex gap-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${getStatusTone(hackathon.calculatedStatus)}`}>
                      {hackathon.calculatedStatus}
                    </span>
                  </div>
                  
                  <div className="absolute right-5 top-5">
                    <span className="flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/20 capitalize">
                      {getModeIcon(hackathon.mode)}
                      {hackathon.mode}
                    </span>
                  </div>

                  {/* Title overlaying image bottom */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <h4 className="text-2xl font-bold tracking-tight text-white line-clamp-1 shadow-sm">
                      {hackathon.title}
                    </h4>
                    <p className="mt-1 text-sm font-medium text-slate-300 flex items-center gap-1.5">
                       <Trophy size={14} className="text-yellow-400" />
                       {hackathon.prize || "Prize TBA"} • {hackathon.organizerName}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-6">
                  {/* Short description limit */}
                  <p className="text-sm leading-relaxed text-slate-600 line-clamp-2 mb-6">
                    {hackathon.description.replace(/[#*]/g, '').trim()}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 mb-6">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <div className="rounded-full bg-blue-100 p-2 text-blue-600"><Calendar size={16} /></div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {hackathon.startDate.replace("Posted", "").trim()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <div className="rounded-full bg-red-100 p-2 text-red-600"><MapPin size={16} /></div>
                      <div className="w-full overflow-hidden">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Location</div>
                        <div className="text-sm font-semibold text-slate-900 truncate" title={hackathon.location}>
                          {hackathon.location ? hackathon.location.split(',').slice(-2).join(',') : "Online"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    {(hackathon.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 border border-violet-100">
                        {tag}
                      </span>
                    ))}
                    {(hackathon.tags || []).length > 3 && (
                       <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                         +{hackathon.tags.length - 3} more
                       </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                    {hackathon.calculatedStatus === "ongoing" ? (
                      <Link
                        to={`/hackathon/${hackathon._id || hackathon.id}`}
                        className="flex-1 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5 text-sm font-bold text-violet-700 transition-colors duration-200 hover:bg-violet-100 text-center"
                      >
                        View Details
                      </Link>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <button
                      onClick={() => handleRegister(hackathon)}
                      disabled={isEnded}
                      className={`flex flex-1 items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all ${
                        !isEnded
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5"
                            : "bg-slate-300 text-slate-500"
                      } disabled:cursor-not-allowed`}
                    >
                      {isEnded
                        ? "Event Ended"
                        : "Register Now"
                      }
                      <ArrowUpRight size={16} className="ml-1.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
          <Sparkles className="mb-4 h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900">No hackathons found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            We couldn't find any hackathons matching your current filters. Try adjusting your search or status.
          </p>
        </div>
      )}
    </div>
  );
};

export default BrowseHackathons;