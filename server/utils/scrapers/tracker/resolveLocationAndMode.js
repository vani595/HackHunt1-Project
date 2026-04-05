/**
 * Separates event mode (online vs in-person) from venue text.
 * Falls back to college/university names in title, organizer, or description.
 */

const MODE_ONLY_LABELS = new Set([
  "online",
  "virtual",
  "remote",
  "digital",
  "hybrid",
  "worldwide",
  "global"
]);

const NOISE_PREFIX = new RegExp(
  "^\\s*(organized by|hosted by|hosted at|held at|held in|presented by|" +
    "brought to you by|powered by|from|at the|at|join us at|register at)\\s+",
  "i"
);

function trimText(s) {
  return s == null ? "" : String(s).replace(/\s+/g, " ").trim();
}

function isModeOnlyLabel(s) {
  const t = trimText(s).toLowerCase();
  if (!t) return true;
  if (MODE_ONLY_LABELS.has(t)) return true;
  if (/^online\s+/i.test(t) && t.length < 24) return true;
  return false;
}

function stripOrganizerPrefix(s) {
  const t = trimText(s);
  const m = t.match(/^organizer\s*:\s*(.+)$/i);
  return m ? trimText(m[1]) : t;
}

function cleanInstitutionPhrase(s) {
  let t = trimText(s);
  let prev;
  do {
    prev = t;
    t = t.replace(NOISE_PREFIX, "").trim();
  } while (t !== prev);
  t = t.replace(/\s+(hackathon|hackfest|event|competition)\s*$/i, "").trim();
  return t;
}

function looksLikePhysicalVenue(s) {
  const t = trimText(s);
  if (t.length < 4) return false;
  const lower = t.toLowerCase();
  if (/\b(university|college|institute|institution|campus|school|polytechnic|academy|seminary)\b/.test(lower))
    return true;
  if (/\b(iit|nit|iiit|bits)\b/i.test(t)) return true;
  if (/,\s*\S/.test(t)) return true;
  if (/\b(india|usa|canada|uk|germany|france|china|japan|australia|brazil|mexico)\b/.test(lower))
    return true;
  return false;
}

/**
 * Pull a college/university-style span from free text.
 * Caller orders sources: title → organizer → subtitle → description.
 */
function extractInstitutionFromText(raw) {
  if (!raw) return "";
  let text = cleanInstitutionPhrase(stripOrganizerPrefix(String(raw)));

  const candidates = [];

  const pushIfValid = (chunk) => {
    const c = cleanInstitutionPhrase(chunk);
    if (!c || c.length < 4 || isModeOnlyLabel(c)) return;
    if (
      !/\b(university|college|institute|institution|campus|polytechnic|academy|school)\b/i.test(c) &&
      !/\b(iit|iiit|nit|bits)\b/i.test(c)
    ) {
      return;
    }
    candidates.push(c);
  };

  const patterns = [
    /\b(University of\s+[A-Za-z0-9][A-Za-z0-9&,.'\-\s]{2,80})/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'\-\s]{2,80}?\s+University)\b/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'\-\s]{2,100}?\s+(?:Institute|Institution)(?:\s+of\s+[A-Za-z0-9][A-Za-z0-9&,.'\-\s]+)?)\b/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'\-\s]{2,80}?\s+College(?:\s+of\s+[A-Za-z][A-Za-z\s]+)?)\b/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'\-\s]{2,50}?\s+Campus)\b/gi,
    /\b((?:IIT|IIIT|NIT|BITS)\s+[A-Za-z][A-Za-z0-9'\-\s]{1,48})\b/gi,
    /\b(Indian Institute of Technology(?:\s+[A-Za-z][A-Za-z'\-\s]+)?)\b/gi,
    /\b(?:at|@)\s+([A-Za-z0-9][A-Za-z0-9&,.'\-\s]{2,80}?(?:University|College|Institute|Campus))\b/gi
  ];

  for (const re of patterns) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      if (m[1]) pushIfValid(m[1]);
    }
  }

  if (candidates.length) {
    return candidates.reduce((a, b) => (a.length >= b.length ? a : b));
  }

  const clauses = text.split(/[,|]\s*|\s+[–—]\s+|\s+\|\s+/);
  for (const clause of clauses) {
    const t = trimText(clause);
    if (
      t.length >= 8 &&
      t.length < 140 &&
      /\b(university|institute|college|campus)\b/i.test(t) &&
      !isModeOnlyLabel(t)
    ) {
      pushIfValid(t);
    }
  }

  return candidates.length ? candidates.reduce((a, b) => (a.length >= b.length ? a : b)) : "";
}

function textHintsOnlineMode(title, organizer, description) {
  const blob = `${title} ${organizer} ${description}`.toLowerCase();
  return /\bvirtual\b|\bfully online\b|\bonline only\b|\bremote only\b/.test(blob);
}

function logLocationFallback(sourceTag, title, organizer) {
  console.warn(
    `[locationExtract] No venue before Online/Unknown fallback | source=${sourceTag} | title="${title}" | organizer="${organizer}"`
  );
}

/**
 * Priority:
 * 1) Explicit location (when not mode-only)
 * 2) Institution extracted from title → organizer → subtitle → description
 * 3) Whole organizer string when it clearly looks like a venue (commas, country, etc.)
 * 4) "Online" if mode is online-ish, else "Unknown"
 */
function resolveLocationAndModeCore({
  explicitLocationRaw = "",
  icon = "",
  organizationName = "",
  title = "",
  subtitle = "",
  description = "",
  sourceTag = "unknown"
}) {
  const rawLoc = trimText(explicitLocationRaw);
  const org = trimText(organizationName);
  const titleT = trimText(title);
  const subT = trimText(subtitle);
  const descT = trimText(description);

  const displayedIsModeOnly = isModeOnlyLabel(rawLoc);
  const isGlobe = trimText(icon) === "globe";
  const modeShouldBeOnline =
    isGlobe || displayedIsModeOnly || textHintsOnlineMode(titleT, org, descT);

  let location = "";
  if (rawLoc && !displayedIsModeOnly) {
    location = cleanInstitutionPhrase(rawLoc);
  }

  if (!location) {
    for (const chunk of [titleT, org, subT, descT]) {
      const extracted = extractInstitutionFromText(chunk);
      if (extracted) {
        location = extracted;
        break;
      }
    }
  }

  if (!location && org && looksLikePhysicalVenue(org) && !isModeOnlyLabel(org)) {
    location = cleanInstitutionPhrase(org);
  }

  if (!location) {
    logLocationFallback(sourceTag, titleT, org);
    location = modeShouldBeOnline ? "Online" : "Unknown";
  }

  const mode = modeShouldBeOnline ? "online" : "in-person";

  return { mode, location };
}

function resolveFromDevpostHackathon(h, ctx = {}) {
  const dl = h.displayed_location || {};
  return resolveLocationAndModeCore({
    explicitLocationRaw: dl.location,
    icon: dl.icon,
    organizationName: h.organization_name,
    title: h.title,
    subtitle: ctx.subtitle ?? h.subtitle ?? h.tagline ?? "",
    description: ctx.description ?? h.description ?? "",
    sourceTag: "Devpost"
  });
}

function firstNonEmptyString(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && trimText(v)) return trimText(v);
  }
  return "";
}

function collectUnstopDescriptionParts(h) {
  const parts = [];
  const keys = [
    "venue",
    "venue_name",
    "venueName",
    "event_venue",
    "venue_address",
    "address",
    "full_address",
    "location_name",
    "region",
    "city_region",
    "short_description",
    "about"
  ];
  for (const k of keys) {
    const v = h[k];
    if (typeof v === "string" && trimText(v)) parts.push(trimText(v));
  }

  const org = h.organisation || h.organization;
  if (org && typeof org === "object") {
    for (const nk of ["name", "title", "full_name", "address", "location"]) {
      const v = org[nk];
      if (typeof v === "string" && trimText(v)) parts.push(trimText(v));
    }
  }

  if (typeof h.description === "string" && trimText(h.description)) {
    parts.push(stripOrganizerPrefix(h.description));
  }

  return parts.join(" | ");
}

function detectUnstopModeHint(h) {
  const parts = [
    h.event_mode,
    h.mode,
    h.participation_mode,
    h.event_type,
    h.hackathon_mode,
    h.hackathon_type,
    h.type
  ]
    .filter((x) => typeof x === "string")
    .map((x) => x.toLowerCase())
    .join(" ");

  if (/\boffline\b|\bin[\s-]?person\b|\bonsite\b|\bphysical\b/.test(parts)) return "in-person";
  if (/\bonline\b|\bvirtual\b|\bremote\b/.test(parts)) return "online";
  if (h.is_online === true || h.online === true) return "online";
  if (h.is_online === false || h.offline === true) return "in-person";
  return null;
}

function resolveFromUnstopRow(h) {
  const modeHint = detectUnstopModeHint(h);
  const title = trimText(h.title || h.name);
  const org = firstNonEmptyString(h, [
    "organization_name",
    "organizer_name",
    "host_name",
    "organisation_name"
  ]);
  const explicit = firstNonEmptyString(h, [
    "venue",
    "venue_name",
    "venueName",
    "location_name",
    "address",
    "region"
  ]);
  const description = collectUnstopDescriptionParts(h);

  const r = resolveLocationAndModeCore({
    explicitLocationRaw: explicit,
    icon: "",
    organizationName: org,
    title,
    subtitle: trimText(h.subtitle),
    description,
    sourceTag: "Unstop"
  });

  let mode = r.mode;
  if (modeHint === "in-person") mode = "in-person";
  if (modeHint === "online") mode = "online";

  return { mode, location: r.location };
}

function resolveFromGenericHackathonRow(row, sourceTag = "MLH") {
  return resolveLocationAndModeCore({
    explicitLocationRaw: row.location || row.venue || row.city || "",
    icon: row.location_icon || row.icon || "",
    organizationName: row.organization_name || row.host_name || row.host || row.organizer || "",
    title: row.title || row.name || "",
    subtitle: row.subtitle || row.tagline || "",
    description: row.description || "",
    sourceTag
  });
}

module.exports = {
  trimText,
  isModeOnlyLabel,
  looksLikePhysicalVenue,
  cleanInstitutionPhrase,
  extractInstitutionFromText,
  resolveLocationAndModeCore,
  resolveFromDevpostHackathon,
  resolveFromUnstopRow,
  resolveFromGenericHackathonRow
};
