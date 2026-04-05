import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Calendar,
  Filter,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  Globe
} from "lucide-react";
import { apiClient } from "../../api/client";
import { useRealtimeStream } from "../../hooks/useRealtimeStream";
import { deriveHackathonDisplayLocation } from "../../utils/deriveHackathonDisplayLocation";

/** Map GET /hackathons/live items to the card model used in this component */
function mapLiveApiToCard(h) {
  const deadline = h.deadline && h.deadline !== "N/A" ? String(h.deadline) : "";
  
  // Priority 1: Check status field first
  const normalizedStatus = String(h.status || "").toLowerCase();
  let calculatedStatus = "ongoing"; // Default to ongoing for live/external events
  
  if (normalizedStatus === "open" || normalizedStatus === "active" || normalizedStatus === "ongoing") {
    calculatedStatus = "ongoing";
  } else if (normalizedStatus === "ended" || normalizedStatus === "closed" || normalizedStatus === "past") {
    calculatedStatus = "ended";
  } else if (normalizedStatus === "upcoming" || normalizedStatus === "scheduled" || normalizedStatus === "planned") {
    calculatedStatus = "upcoming";
  } else if (deadline) {
    // Priority 2: Fall back to deadline-based logic for external events
    const end = Date.parse(deadline);
    if (!Number.isNaN(end)) {
      calculatedStatus = end < Date.now() ? "ended" : "upcoming";
    }
  }
  
  const desc =
    Array.isArray(h.tags) && h.tags.length
      ? h.tags.join(" · ")
      : `Listed on ${h.platform}. Open the event page to register.`;

  const mode = h.mode === "in-person" ? "in-person" : "online";
  const location = deriveHackathonDisplayLocation({
    location: h.location,
    description: desc,
    organizerName: h.platform || "External",
    title: h.title
  });

  return {
    _id: h.id,
    id: h.id,
    title: h.title,
    description: desc,
    organizerName: h.platform || "External",
    location,
    totalPrize: h.prize,
    prize: h.prize,
    imageUrl: h.image,
    mode,
    calculatedStatus,
    startDate: deadline || "See event page",
    endDate: deadline,
    tags: Array.isArray(h.tags) ? h.tags : [],
    registrationUrl: h.url,
    isLiveScraped: true,
    sourcePlatform: h.platform || inferPlatformFromUrl(h.url)
  };
}

function normalizeDateValue(dateString) {
  if (!dateString) return null;
  const cleaned = String(dateString).replace(/Posted\s*/i, "").trim();
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(dateString) {
  const dateObj = normalizeDateValue(dateString);
  if (!dateObj) return String(dateString || "TBA").trim();
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

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

function inferPlatformFromUrl(url) {
  const value = String(url || "").toLowerCase();
  if (!value) return "HackHunt";
  if (value.includes("devpost.com")) return "Devpost";
  if (value.includes("unstop.com")) return "Unstop";
  if (value.includes("devfolio.co")) return "Devfolio";
  if (value.includes("mlh.io")) return "MLH";
  if (value.includes("topcoder.com")) return "Topcoder";
  return "HackHunt";
}

function mapInternalHackathonToCard(h) {
  const organizerName = h.organizerName || h.organizer || "Organizer";
  const location = deriveHackathonDisplayLocation({
    location: h.location,
    description: h.description,
    organizerName,
    organizer: h.organizer,
    title: h.title
  });
  return {
    ...h,
    _id: h._id || h.id,
    id: h.id || h._id,
    prize: h.prize || h.totalPrize,
    organizerName,
    location,
    calculatedStatus: h.status || "upcoming",
    sourcePlatform: inferPlatformFromUrl(h.registrationUrl),
    isInternal: true,
    isLiveScraped: false
  };
}

const BrowseHackathons = ({ user, initialSearchTerm = "" }) => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dataSource, setDataSource] = useState(""); // 'platform' | 'platform+live' | 'live'
  const [reloadKey, setReloadKey] = useState(0);
  const [registeringId, setRegisteringId] = useState("");

  useRealtimeStream({
    "hackathon:created": () => setReloadKey((value) => value + 1),
    "hackathon:updated": () => setReloadKey((value) => value + 1),
    "hackathon:deleted": () => setReloadKey((value) => value + 1),
    "hackathon:approval-updated": () => setReloadKey((value) => value + 1),
    "registration:created": () => setReloadKey((value) => value + 1),
    "registration:deleted": () => setReloadKey((value) => value + 1)
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      let platformRows = [];
      let liveRows = [];

      try {
        const res = await apiClient.getHackathons();
        platformRows = (res.hackathons || []).map(mapInternalHackathonToCard);
      } catch (apiErr) {
        console.warn("Platform hackathons API:", apiErr?.message || apiErr);
      }

      try {
        const res = await apiClient.getLiveScrapedHackathons();
        const live = res.hackathons || [];
        liveRows = live.map(mapLiveApiToCard);
      } catch (apiErr) {
        console.warn("Live hackathons API:", apiErr?.message || apiErr);
      }

      let rows = [...platformRows, ...liveRows];

      if (platformRows.length > 0 && liveRows.length > 0) {
        setDataSource("platform+live");
      } else if (platformRows.length > 0) {
        setDataSource("platform");
      } else if (liveRows.length > 0) {
        setDataSource("live");
      }

      if (rows.length === 0) {
        setDataSource("");
      }

      setHackathons(rows);
    } catch (err) {
      console.error("Error loading hackathons:", err);
      setError("Could not load hackathons. Try again later.");
      setHackathons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadKey]);

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
        ${hackathon.sourcePlatform || ""}
      `.toLowerCase();
      
      const matchesSearch = !searchTerm || searchTarget.includes(searchTerm.toLowerCase().trim());

      // 2. Status Logic
      const matchesStatus = filterStatus === "all" || hackathon.calculatedStatus === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, hackathons, searchTerm]);

  const handleRegister = async (hackathon) => {
    const externalUrl = hackathon.registrationUrl || hackathon.url;
    if (externalUrl && String(externalUrl).startsWith("http")) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (hackathon.isInternal) {
      const userId = user?.id || localStorage.getItem("userId");
      if (!userId) {
        setError("Please sign in again to register for this hackathon.");
        setTimeout(() => setError(""), 3000);
        return;
      }

      try {
        setRegisteringId(hackathon._id || hackathon.id);
        setError("");
        setSuccess("");
        await apiClient.registerForHackathon(hackathon._id || hackathon.id, {
          userId,
          teamName: "",
          teamMembers: 1
        });
        setSuccess(`Registered for ${hackathon.title} successfully.`);
        setTimeout(() => setSuccess(""), 3000);
        setReloadKey((value) => value + 1);
      } catch (err) {
        setError(err.message || "Failed to register for hackathon.");
        setTimeout(() => setError(""), 3000);
      } finally {
        setRegisteringId("");
      }
      return;
    }

    setError("Could not find a registration URL for this hackathon.");
    setTimeout(() => setError(""), 3000);
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
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.84))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_26%),linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              <Sparkles size={14} />
              {dataSource === "live" ? "Live feed (Devpost only)" : "Discovery"}
            </div>
            <h3 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-950 dark:text-slate-50">
              Explore Premium Hackathons
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
              {dataSource === "live"
                ? "Live listings from the server (Devpost API only). Register opens the official event page."
                : dataSource === "platform"
                ? "Approved HackHunt hackathons are now live here for users to discover and register."
                : dataSource === "platform+live"
                ? "Browse approved HackHunt hackathons alongside live external listings in one place."
                : "Discover cutting-edge events, compete with the best, and build the future."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-blue-200 bg-blue-50/90 px-4 py-4 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Total Events</div>
              <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">{hackathons.length}</div>
            </div>
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/90 px-4 py-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Active Events</div>
              <div className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50">
                {hackathons.filter((item) => item.calculatedStatus === "ongoing").length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {success}
        </div>
      )}

      <section className="rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, location, or organizer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 text-sm text-slate-900 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400">
              <Filter size={16} />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>
      </section>

      {filteredHackathons.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {filteredHackathons.map((hackathon, index) => {
            const isEnded = hackathon.calculatedStatus === "ended";

            return (
              <article
                key={hackathon._id}
                className="group relative flex flex-col overflow-hidden rounded-[34px] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgba(79,70,229,0.16)] dark:border-white/10 dark:bg-slate-900/75 dark:shadow-[0_18px_50px_rgba(2,6,23,0.45)]"
                style={{ animation: `feature-fade-up 0.55s ease-out ${index * 0.06}s both` }}
              >
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
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />

                  <div className="absolute left-5 top-5 flex gap-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md ${getStatusTone(hackathon.calculatedStatus)}`}>
                      {hackathon.calculatedStatus}
                    </span>
                  </div>

                  <div className="absolute right-5 top-5 flex flex-col items-end gap-1">
                    {hackathon.sourcePlatform && (
                      <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
                        {hackathon.sourcePlatform}
                      </span>
                    )}
                    <span className="flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/20 capitalize">
                      {getModeIcon(hackathon.mode)}
                      {hackathon.mode}
                    </span>
                  </div>

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

                <div className="flex flex-1 flex-col p-6">
                  <p className="mb-6 text-sm leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-300">
                    {(hackathon.description || "")
                      .replace(/[#*]/g, "")
                      .trim()}
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 mb-6">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-800/70">
                      <div className="rounded-full bg-blue-100 p-2 text-blue-600"><Calendar size={16} /></div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Date</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatDate(hackathon.startDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-800/70">
                      <div className="rounded-full bg-red-100 p-2 text-red-600"><MapPin size={16} /></div>
                      <div className="w-full overflow-hidden">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500">Location</div>
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={hackathon.location}>
                          {hackathon.location ? hackathon.location.split(',').slice(-2).join(',') : "Online"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    {(hackathon.tags || []).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300">
                        {tag}
                      </span>
                    ))}
                    {(hackathon.tags || []).length > 3 && (
                       <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                         +{hackathon.tags.length - 3} more
                       </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-white/10">
                    {hackathon.isInternal ? (
                      <Link
                        to={`/hackathon/${hackathon._id || hackathon.id}`}
                        className="flex-1 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5 text-center text-sm font-bold text-violet-700 transition-colors duration-200 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/20"
                      >
                        View Details
                      </Link>
                    ) : hackathon.isLiveScraped &&
                    hackathon.registrationUrl &&
                    String(hackathon.registrationUrl).startsWith("http") ? (
                      <a
                        href={hackathon.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5 text-center text-sm font-bold text-violet-700 transition-colors duration-200 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/20"
                      >
                        View Details
                      </a>
                    ) : hackathon.calculatedStatus === "ongoing" ? (
                      <Link
                        to={`/hackathon/${hackathon._id || hackathon.id}`}
                        className="flex-1 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5 text-center text-sm font-bold text-violet-700 transition-colors duration-200 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/20"
                      >
                        View Details
                      </Link>
                    ) : (
                      <div className="flex-1" />
                    )}

                    <button
                      onClick={() => handleRegister(hackathon)}
                      disabled={isEnded || registeringId === (hackathon._id || hackathon.id)}
                      className={`flex flex-1 items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all ${
                        !isEnded
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5"
                            : "bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                      } disabled:cursor-not-allowed`}
                    >
                      {isEnded
                        ? "Event Ended"
                        : registeringId === (hackathon._id || hackathon.id)
                        ? "Registering..."
                        : "Register Now"}
                      <ArrowUpRight size={16} className="ml-1.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center dark:border-white/10 dark:bg-slate-900/55">
          <Sparkles className="mb-4 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No hackathons found</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            We couldn't find any hackathons matching your current filters. Try adjusting your search or status.
          </p>
        </div>
      )}
    </div>
  );
};

export default BrowseHackathons;
