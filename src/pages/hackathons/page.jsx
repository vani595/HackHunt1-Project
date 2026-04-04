/**
 * Live scraped hackathons (Devpost, Unstop, Devfolio).
 * Vite + React — `'use client'` is ignored (no React Server Components).
 */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../api/client";
import { RefreshCw, AlertCircle } from "lucide-react";
import FilterBar from "./FilterBar";
import HackathonCard from "./HackathonCard";
import SkeletonCard from "./SkeletonCard";

const REFRESH_MS = 30 * 60 * 1000;

function parsePrizeValue(prize) {
  if (!prize || prize === "N/A") return 0;
  const m = String(prize).match(/[\d][\d,]*(?:\.\d+)?/g);
  if (!m) return 0;
  const nums = m.map((x) => parseFloat(x.replace(/,/g, "")) || 0);
  return Math.max(...nums, 0);
}

function parseDeadlineMs(deadline) {
  if (!deadline) return Number.POSITIVE_INFINITY;
  const t = Date.parse(deadline);
  if (!Number.isNaN(t)) return t;
  const loose = Date.parse(String(deadline).replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, "$3-$1-$2"));
  return Number.isNaN(loose) ? Number.POSITIVE_INFINITY : loose;
}

function minutesAgo(iso) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const m = Math.floor((Date.now() - then) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export default function LiveHackathonsPage() {
  const [raw, setRaw] = useState([]);
  const [cachedAt, setCachedAt] = useState(null);
  const [sources, setSources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [sort, setSort] = useState("ending");

  const load = useCallback(async (refresh = false) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.getLiveScrapedHackathons({
        refresh: refresh ? "1" : false
      });
      setRaw(res.hackathons || []);
      setCachedAt(res.cachedAt || null);
      setSources(res.sources || {});
    } catch (e) {
      setError(e.message || "Failed to load hackathons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      load(false);
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...raw];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((h) => (h.title || "").toLowerCase().includes(q));
    }
    if (platform !== "All") {
      list = list.filter((h) => h.platform === platform);
    }

    if (sort === "ending") {
      list.sort((a, b) => parseDeadlineMs(a.deadline) - parseDeadlineMs(b.deadline));
    } else if (sort === "prize") {
      list.sort((a, b) => parsePrizeValue(b.prize) - parsePrizeValue(a.prize));
    } else {
      list.reverse();
    }

    return list;
  }, [raw, search, platform, sort]);

  return (
    <div className="min-h-screen bg-[#0b0a14] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Live hackathons
            </h1>
            <p className="mt-2 max-w-2xl text-slate-400">
              Aggregated from Devpost (API), Unstop (live page + JSON), and DoraHacks (API).
              Cached on the server for 30 minutes; this page refetches on the same schedule.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Last updated:{" "}
              <span className="text-slate-300">{minutesAgo(cachedAt)}</span>
              {Object.keys(sources).length > 0 && (
                <span className="ml-2 text-slate-600">
                  (
                  {Object.entries(sources)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                  )
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh now
          </button>
        </header>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          platform={platform}
          onPlatformChange={setPlatform}
          sort={sort}
          onSortChange={setSort}
        />

        {error && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/40 bg-red-950/30 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-red-200">{error}</p>
            <button
              type="button"
              onClick={() => load(true)}
              className="rounded-xl bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!error && !loading && filtered.length === 0 && (
          <p className="mt-16 text-center text-slate-500">
            No hackathons match your filters, or the scrapers could not parse the sites
            (HTML changes often). Try <strong>Refresh now</strong> or check the server
            logs.
          </p>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((h) => (
              <HackathonCard key={h.id} hackathon={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
