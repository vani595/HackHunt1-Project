export const allowedEmailDomains = ["gmail.com"];

export function isEmailDomainAllowed(email, allowedDomains = allowedEmailDomains) {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();

  const match = normalized.match(/^[^\s@]+@([^\s@]+)$/);
  if (!match) return false;

  const domain = match[1].toLowerCase();
  return allowedDomains.includes(domain);
}
