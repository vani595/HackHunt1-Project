/**
 * Live hackathon listings from Devpost, Unstop, and DoraHacks trackers.
 *
 * 30-minute in-memory cache. Use ?refresh=1 to bypass.
 */

const crypto = require("crypto");

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const scrapeDevpost = require("./tracker/devpost");
const scrapeUnstop = require("./tracker/unstop");
const scrapeDoraHacks = require("./tracker/dorahacks");

const CACHE_TTL_MS = 30 * 60 * 1000;

let cache = {
  hackathons: [],
  cachedAt: null,
  sources: {},
  ttlMs: CACHE_TTL_MS
};

function stableId(platform, url) {
  return crypto.createHash("sha256").update(`${platform}|${url}`).digest("hex").slice(0, 20);
}

function normalizeItem(raw) {
  const platform = raw.platform || raw.source || "Unknown";
  const url = (raw.url || "").trim();
  const image = (raw.image || raw.thumbnail || "").trim();
  const title =
    (raw.title && String(raw.title).trim().length > 1
      ? String(raw.title).trim()
      : null) || inferTitleFromUrl(url) || "Untitled hackathon";
  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : Array.isArray(raw.themes)
      ? raw.themes.map((t) => (typeof t === "string" ? t : t?.name)).filter(Boolean)
      : [];

  const locRaw = raw.location != null ? String(raw.location).trim() : "";
  const location = locRaw || "Online";
  const mode = raw.mode === "in-person" ? "in-person" : "online";

  return {
    id: stableId(platform, url || title),
    title: title.slice(0, 300),
    platform,
    url: url || "#",
    deadline: raw.deadline != null ? String(raw.deadline).trim() : "",
    prize:
      raw.prize != null && String(raw.prize).trim()
        ? String(raw.prize).trim()
        : "N/A",
    image,
    tags: tags.slice(0, 12),
    mode,
    location
  };
}

function inferTitleFromUrl(url) {
  if (!url || !String(url).includes("http")) return "";
  try {
    const path = new URL(url).pathname.split("/").filter(Boolean);
    const last = path[path.length - 1] || "";
    return last
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "";
  }
}

async function runScrapers() {
  const settled = await Promise.allSettled([
    scrapeDevpost(3),
    scrapeUnstop(),
    scrapeDoraHacks()
  ]);

  const sourceNames = ["Devpost", "Unstop", "DoraHacks"];
  const sources = {};
  settled.forEach((r, i) => {
    sources[sourceNames[i]] = r.status === "fulfilled" ? "ok" : "error";
  });

  settled.forEach((r, i) => {
    if (r.status === "rejected") {
      console.warn(`[liveScraper] ${sourceNames[i]}`, r.reason?.message);
    }
  });

  const merged = [];
  settled.forEach((r) => {
    if (r.status !== "fulfilled" || !Array.isArray(r.value)) return;
    r.value.forEach((row) => {
      const url = (row.url || "").trim();
      if (!url) return;
      merged.push(
        normalizeItem({
          title: row.title,
          url,
          deadline: row.deadline,
          prize: row.prize,
          image: row.thumbnail || row.image,
          themes: row.themes,
          platform: row.source,
          mode: row.mode,
          location: row.location
        })
      );
    });
  });

  return { hackathons: merged, sources };
}

async function getLiveScrapedHackathons({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cache.cachedAt && now - cache.cachedAt < CACHE_TTL_MS) {
    return {
      hackathons: cache.hackathons,
      cachedAt: new Date(cache.cachedAt).toISOString(),
      sources: cache.sources,
      ttlMs: CACHE_TTL_MS,
      fromCache: true
    };
  }

  try {
    const { hackathons, sources } = await runScrapers();
    cache = {
      hackathons,
      cachedAt: now,
      sources,
      ttlMs: CACHE_TTL_MS
    };
    return {
      hackathons,
      cachedAt: new Date(now).toISOString(),
      sources,
      ttlMs: CACHE_TTL_MS,
      fromCache: false
    };
  } catch (e) {
    console.error("[liveHackathonScraper]", e);
    if (cache.cachedAt) {
      return {
        hackathons: cache.hackathons,
        cachedAt: new Date(cache.cachedAt).toISOString(),
        sources: cache.sources,
        ttlMs: CACHE_TTL_MS,
        fromCache: true,
        stale: true
      };
    }
    throw e;
  }
}

module.exports = {
  getLiveScrapedHackathons,
  CACHE_TTL_MS
};
