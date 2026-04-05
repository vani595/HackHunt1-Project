/**
 * Unstop: fetch listing page and extract hackathons from __NEXT_DATA__ or embedded JSON.
 * Falls back to link scraping. No Puppeteer required (avoids large browser downloads).
 */
const axios = require("axios");
const cheerio = require("cheerio");
const { resolveFromUnstopRow } = require("./resolveLocationAndMode");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseNextData(html) {
  const m = html.match(
    /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/** Find arrays of objects that look like Unstop hackathon rows */
function collectHackathonLikeArrays(obj, depth = 0, out = []) {
  if (depth > 35 || obj == null) return out;
  if (Array.isArray(obj)) {
    if (
      obj.length > 0 &&
      typeof obj[0] === "object" &&
      obj[0] &&
      (obj[0].seo_url || obj[0].public_url || obj[0].title) &&
      (obj[0].end_date || obj[0].registration_end_date || obj[0].title)
    ) {
      out.push(obj);
    }
    obj.forEach((x) => collectHackathonLikeArrays(x, depth + 1, out));
    return out;
  }
  if (typeof obj === "object") {
    Object.values(obj).forEach((v) => collectHackathonLikeArrays(v, depth + 1, out));
  }
  return out;
}

function mapRow(h) {
  const url =
    h.public_url ||
    (h.seo_url ? `https://unstop.com/hackathons/${h.seo_url}` : "") ||
    (typeof h._id === "string" ? `https://unstop.com/hackathon/${h._id}` : "");
  const { mode, location } = resolveFromUnstopRow(h);
  return {
    title: h.title || h.name || "Untitled",
    url,
    deadline: h.end_date || h.registration_end_date || h.start_date || "N/A",
    prize: h.prize_money != null ? `$${h.prize_money}` : "N/A",
    participants: h.registered_count || 0,
    thumbnail: h.cover_image || h.logoUrl2 || h.banner || "",
    source: "Unstop",
    themes: Array.isArray(h.themes) ? h.themes : [],
    mode,
    location
  };
}

async function scrapeUnstop() {
  console.log("[tracker] Scraping Unstop (HTTP + __NEXT_DATA__)...");
  try {
    const { data: html } = await axios.get("https://unstop.com/hackathons", {
      headers: { "User-Agent": UA, Accept: "text/html" },
      timeout: 30000,
      maxRedirects: 5
    });

    const next = parseNextData(html);
    const merged = [];
    if (next) {
      const arrays = collectHackathonLikeArrays(next);
      const seen = new Set();
      arrays.forEach((arr) => {
        arr.forEach((h) => {
          if (!h || typeof h !== "object") return;
          const row = mapRow(h);
          if (!row.url) return;
          const key = row.url.split("?")[0];
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(row);
        });
      });
    }

    if (merged.length > 0) {
      console.log(`[tracker] Unstop: ${merged.length} from __NEXT_DATA__`);
      return merged;
    }

    // Cheerio fallback: visible hackathon links
    const $ = cheerio.load(html);
    const seen = new Set();
    const fallback = [];
    $('a[href]').each((_, el) => {
      let href = $(el).attr("href");
      if (!href) return;
      if (href.startsWith("/")) href = `https://unstop.com${href}`;
      if (!href.includes("unstop.com")) return;
      if (/\/hackathons?\/?(\?|$)/.test(href)) return;
      if (!/\/(hackathon|competition|challenge)/i.test(href)) return;
      const full = href.startsWith("http") ? href : `https://unstop.com${href}`;
      const key = full.split("?")[0];
      if (seen.has(key)) return;
      seen.add(key);
      const title = $(el).text().trim() || "Hackathon";
      fallback.push({
        title: title.slice(0, 200),
        url: key,
        deadline: "N/A",
        prize: "N/A",
        participants: 0,
        thumbnail: "",
        source: "Unstop",
        themes: [],
        mode: "online",
        location: "Online"
      });
    });

    console.log(`[tracker] Unstop: ${fallback.length} from link fallback`);
    return fallback;
  } catch (e) {
    console.warn("[tracker] Unstop error:", e.message);
    return [];
  }
}

module.exports = scrapeUnstop;
