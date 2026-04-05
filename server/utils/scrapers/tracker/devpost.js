/**
 * Devpost public JSON API (from hackathon-tracker) — more stable than HTML scraping.
 */
const https = require("https");
const { resolveFromDevpostHackathon } = require("./resolveLocationAndMode");

function fetchJSON(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json"
        }
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchJSON(res.headers.location, timeoutMs).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
  });
}

function normalizeThumbnail(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}

async function scrapeDevpost(pages = 3) {
  console.log("[tracker] Scraping Devpost API...");
  const allItems = [];
  try {
    for (let page = 1; page <= pages; page++) {
      const url = `https://devpost.com/api/hackathons?status[]=open&order_by=deadline&page=${page}`;
      let data;
      let lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          data = await fetchJSON(url);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
      if (!data) throw lastErr || new Error("Devpost fetch failed");
      const items = data.hackathons || [];
      console.log(`[tracker] Devpost page ${page}: ${items.length} hackathons`);
      if (items.length === 0) break;
      allItems.push(...items);
      if (page >= (data.meta?.total_pages || pages)) break;
    }
    return allItems.map((h) => {
      const { mode, location } = resolveFromDevpostHackathon(h);
      return {
        title: h.title || "Untitled",
        url: h.url || "",
        deadline: h.submission_period_dates || "N/A",
        prize: h.prize_amount || "N/A",
        participants: h.registrations_count || 0,
        thumbnail: normalizeThumbnail(h.thumbnail_url),
        source: "Devpost",
        themes: Array.isArray(h.themes) ? h.themes.map((t) => t.name) : [],
        mode,
        location,
        open_state: h.open_state || "open"
      };
    });
  } catch (e) {
    console.warn("[tracker] Devpost error:", e.message);
    return [];
  }
}

module.exports = scrapeDevpost;
