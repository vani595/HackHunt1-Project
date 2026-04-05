import { Hackathon } from '../../types/hackathon';
import { closeMindsDBConnection, getMindsDBConnection } from '../../api/database';

function trimText(s: unknown): string {
  if (s == null) return '';
  return String(s).replace(/\s+/g, ' ').trim();
}

const MODE_ONLY_LABELS = new Set([
  'online',
  'virtual',
  'remote',
  'digital',
  'hybrid',
  'worldwide',
  'global'
]);

const NOISE_PREFIX = new RegExp(
  '^\\s*(organized by|hosted by|hosted at|held at|held in|presented by|' +
    'brought to you by|powered by|from|at the|at|join us at|register at)\\s+',
  'i'
);

function isModeOnlyLocationLabel(raw: string): boolean {
  const t = trimText(raw).toLowerCase();
  if (!t) return true;
  if (MODE_ONLY_LABELS.has(t)) return true;
  if (/^online\s+/i.test(t) && t.length < 24) return true;
  return false;
}

function stripOrganizerPrefix(s: string): string {
  const t = trimText(s);
  const m = t.match(/^organizer\s*:\s*(.+)$/i);
  return m ? trimText(m[1]) : t;
}

function cleanInstitutionPhrase(s: string): string {
  let t = trimText(s);
  let prev: string;
  do {
    prev = t;
    t = t.replace(NOISE_PREFIX, '').trim();
  } while (t !== prev);
  t = t.replace(/\s+(hackathon|hackfest|event|competition)\s*$/i, '').trim();
  return t;
}

function looksLikePhysicalVenueLabel(s: string): boolean {
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

function extractInstitutionFromText(raw: string): string {
  if (!raw) return '';
  let text = cleanInstitutionPhrase(stripOrganizerPrefix(String(raw)));

  const candidates: string[] = [];

  const pushIfValid = (chunk: string) => {
    const c = cleanInstitutionPhrase(chunk);
    if (!c || c.length < 4 || isModeOnlyLocationLabel(c)) return;
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
    let m: RegExpExecArray | null;
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
      !isModeOnlyLocationLabel(t)
    ) {
      pushIfValid(t);
    }
  }

  return candidates.length ? candidates.reduce((a, b) => (a.length >= b.length ? a : b)) : '';
}

function textHintsOnlineMode(title: string, organizer: string, description: string): boolean {
  const blob = `${title} ${organizer} ${description}`.toLowerCase();
  return /\bvirtual\b|\bfully online\b|\bonline only\b|\bremote only\b/.test(blob);
}

function logLocationFallback(sourceTag: string, title: string, organizer: string): void {
  console.warn(
    `[locationExtract] No venue before Online/Unknown fallback | source=${sourceTag} | title="${title}" | organizer="${organizer}"`
  );
}

function resolveLocationAndModeCore(params: {
  explicitLocationRaw?: string;
  icon?: string;
  organizationName?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  sourceTag?: string;
}): { location: string; type: 'online' | 'in-person' } {
  const rawLoc = trimText(params.explicitLocationRaw);
  const org = trimText(params.organizationName);
  const titleT = trimText(params.title);
  const subT = trimText(params.subtitle);
  const descT = trimText(params.description);

  const displayedIsModeOnly = isModeOnlyLocationLabel(rawLoc);
  const isGlobe = trimText(params.icon) === 'globe';
  const modeShouldBeOnline =
    isGlobe || displayedIsModeOnly || textHintsOnlineMode(titleT, org, descT);

  let location = '';
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

  if (!location && org && looksLikePhysicalVenueLabel(org) && !isModeOnlyLocationLabel(org)) {
    location = cleanInstitutionPhrase(org);
  }

  if (!location) {
    logLocationFallback(params.sourceTag || 'unknown', titleT, org);
    location = modeShouldBeOnline ? 'Online' : 'Unknown';
  }

  const type: 'online' | 'in-person' = modeShouldBeOnline ? 'online' : 'in-person';

  return { location, type };
}

function resolveDevpostLocationAndType(
  item: any,
  opts?: { description?: string; subtitle?: string }
): { location: string; type: 'online' | 'in-person' } {
  const dl = item.displayed_location || {};
  return resolveLocationAndModeCore({
    explicitLocationRaw: dl.location,
    icon: dl.icon,
    organizationName: item.organization_name,
    title: item.title,
    subtitle: opts?.subtitle ?? item.subtitle ?? item.tagline ?? '',
    description: opts?.description ?? item.description ?? '',
    sourceTag: 'Devpost'
  });
}

export async function parseHackathons(jsonData: any): Promise<Hackathon[]> {
  if (!jsonData || !jsonData.hackathons || !Array.isArray(jsonData.hackathons)) {
    console.error('Invalid Devpost JSON data:', jsonData);
    return [];
  }

  return Promise.all(jsonData.hackathons.map(async (item: any) => {
    const submission_period_dates = addMonthToSecondDate(item.submission_period_dates);
    const startDate = parseDateFromSubmissionPeriod(submission_period_dates, 0);
    const endDate = parseDateFromSubmissionPeriod(submission_period_dates, 1);

    const generatedDescription = await fetchDescription(item.url);
    const { location, type } = resolveDevpostLocationAndType(item, {
      description: generatedDescription
    });
    const hackathon: Hackathon = {
      id: 'dp-' + item.id,
      title: item.title,
      description: generatedDescription,
      totalPrize: extractPrizeAmount(item.prize_amount),
      startDate: startDate ? parseDateForDB(startDate.toISOString()) : '',
      endDate: endDate ? parseDateForDB(endDate.toISOString()) : '',
      imageUrl: item.thumbnail_url ? 'https:' + item.thumbnail_url : '', // Ensure https
      registrationUrl: item.url,
      organizer: item.organization_name,
      location,
      type,
      tags: item.themes ? item.themes.map((theme: any) => theme.name) : await fetchTags(generatedDescription),
      status: item.open_state // Assuming open_state maps to status directly, might need adjustments
    };
    return hackathon;
  }));
}

function extractPrizeAmount(prizeAmountString: string): string {
  const match = prizeAmountString.match(/<span data-currency-value>(.*?)<\/span>/);
  return match ? match[1].replace(/,/g, '') : '0';
}

function parseDateFromSubmissionPeriod(submissionPeriod: string, index: number): Date | null {
    if (!submissionPeriod) return null;
    try {
        // Extract the year from the submission period string
        const yearMatch = submissionPeriod.match(/(?:,\s)?(\d{4})$/);
        if (!yearMatch) {
            console.error('Could not extract year from submission period:', submissionPeriod);
            return null;
        }
        const year = parseInt(yearMatch[1], 10);
      
        const dates = submissionPeriod.substring(0, submissionPeriod.lastIndexOf(',')).split(' - ');
        if (dates.length !== 2 || index >= dates.length) return null;
      
        return new Date(dates[index] + ', ' + year);
    } catch (error: any) {
        console.error('Error parsing date:', submissionPeriod, error.message);
        return null;
    }
}

function addMonthToSecondDate(dateRange: string): string {
    const parts = dateRange.split(" - ");
    if (parts.length !== 2) {
      return dateRange; // Invalid format, return as is
    }
  
    const [startDate, endDate] = parts;
    const startMonth = startDate.split(" ")[0];
    const endParts = endDate.split(" ");
  
    if (endParts.length > 1 && endParts[0].match(/^[A-Za-z]{3}$/)) {
      return dateRange; // End date already has a month, return as is
    } else {
      return `${startDate} - ${startMonth} ${endDate}`;
    }
}

async function fetchDescription(url: string): Promise<string> {
    let description = '';
    try {
      const connection = await getMindsDBConnection();
    
      const query = `SELECT answer FROM hack_description_agent WHERE question = 'Fetch description from ${url}'`;
      const [rows] = await connection.query(query);
      if (Array.isArray(rows) && rows.length > 0 && rows[0] != null && typeof rows[0] === 'object' && 'answer' in rows[0]) {
        description = String(rows[0].answer);
      }
    } catch (error) {
      console.error('Error fetching description from MindsDB:', error);
    } 
    return description;
}

async function fetchTags(description: string): Promise<string[]> {
  let tags: string[] = [];
  try {
    const connection = await getMindsDBConnection();
  
    const query = "SELECT tag FROM tag_generation_model where description = ?";
    const [rows] = await connection.query(query, [description]);
    if (Array.isArray(rows) && rows.length > 0 && rows[0] != null && typeof rows[0] === 'object' && 'tag' in rows[0]) {
      tags = String(rows[0].tag || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  } catch (error) {
    console.error('Error fetching description from MindsDB:', error);
  } 
  return tags;
}

function parseDateForDB(dateString: string): string {
    const date = new Date(dateString); // Parse the string to a Date object
    return date.toISOString().split('T')[0];
}
