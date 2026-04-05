/**
 * When DB `location` is a mode label (Online) but organizer/description name a campus,
 * derive a meaningful location for UI (cards, detail page).
 */

const MODE_ONLY = new Set([
  "online",
  "virtual",
  "remote",
  "digital",
  "hybrid",
  "worldwide",
  "global"
]);

function trim(s) {
  return s == null ? "" : String(s).replace(/\s+/g, " ").trim();
}

function isModeOnlyLabel(s) {
  const t = trim(s).toLowerCase();
  return !t || MODE_ONLY.has(t);
}

function stripNoise(s) {
  return trim(s).replace(
    /^\s*(organized by|hosted by|hosted at|held at|presented by|powered by|from|at the|at)\s+/gi,
    ""
  );
}

function looksLikeInstitution(s) {
  const t = trim(s);
  if (t.length < 4) return false;
  const lower = t.toLowerCase();
  if (/\b(university|college|institute|institution|campus|school|polytechnic|academy)\b/.test(lower))
    return true;
  if (/\b(iit|nit|iiit|bits)\b/i.test(t)) return true;
  if (/,\s*\S/.test(t)) return true;
  if (/\b(india|usa|canada|uk|pilani|mumbai|delhi|bangalore|pune|chennai)\b/i.test(lower))
    return true;
  return false;
}

function extractOrganizedByPhrase(description) {
  const m = String(description || "").match(/organized\s+by\s+(.+?)(?:\.\s*$|\.\s|\.$|$)/i);
  if (!m || !m[1]) return "";
  return stripNoise(m[1].trim());
}

function extractInstitutionFromText(raw) {
  if (!raw) return "";
  let text = stripNoise(String(raw));

  const candidates = [];
  const push = (chunk) => {
    const c = stripNoise(chunk);
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
    /\b(University of\s+[A-Za-z0-9][A-Za-z0-9&,.'&\-\s]{2,100})/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'&\-\s]{2,100}?\s+University)\b/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'&\-\s]{2,120}?\s+(?:Institute|Institution)(?:\s+of\s+[A-Za-z0-9][A-Za-z0-9&,.'&\-\s]+)?)\b/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'&\-\s]{2,100}?\s+College(?:\s+of\s+[A-Za-z][A-Za-z\s]+)?)\b/gi,
    /\b([A-Za-z0-9][A-Za-z0-9&,.'&\-\s]{2,60}?\s+Campus)\b/gi,
    /\b((?:IIT|IIIT|NIT|BITS)\s+[A-Za-z][A-Za-z0-9'\-\s]{1,48})\b/gi,
    /\b(Indian Institute of Technology(?:\s+[A-Za-z][A-Za-z'\-\s]+)?)\b/gi
  ];

  for (const re of patterns) {
    let m;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(text)) !== null) {
      if (m[1]) push(m[1]);
    }
  }

  if (candidates.length) {
    return candidates.reduce((a, b) => (a.length >= b.length ? a : b));
  }

  const clauses = text.split(/[,|•]\s*|\s+[–—]\s+/);
  for (const clause of clauses) {
    const t = trim(clause);
    if (
      t.length >= 8 &&
      t.length < 160 &&
      /\b(university|institute|college|campus)\b/i.test(t) &&
      !isModeOnlyLabel(t)
    ) {
      push(t);
    }
  }

  return candidates.length ? candidates.reduce((a, b) => (a.length >= b.length ? a : b)) : "";
}

/**
 * @param {{ location?: string, description?: string, organizerName?: string, organizer?: string, title?: string }} fields
 * @returns {string}
 */
export function deriveHackathonDisplayLocation(fields) {
  const loc = trim(fields.location);
  const desc = trim(fields.description);
  const org = trim(fields.organizerName || fields.organizer);
  const title = trim(fields.title);

  if (loc && !isModeOnlyLabel(loc)) {
    return loc;
  }

  const fromOrganizedBy = extractOrganizedByPhrase(desc);
  if (fromOrganizedBy && !isModeOnlyLabel(fromOrganizedBy) && looksLikeInstitution(fromOrganizedBy)) {
    return fromOrganizedBy;
  }

  if (org && !isModeOnlyLabel(org) && looksLikeInstitution(org)) {
    return org;
  }

  const fromDesc = extractInstitutionFromText(desc);
  if (fromDesc) return fromDesc;

  const fromTitle = extractInstitutionFromText(title);
  if (fromTitle) return fromTitle;

  if (loc) return loc;
  if (org) return org;
  return "Online";
}
