module.exports.allowedEmailDomains = ["gmail.com"];

module.exports.isEmailDomainAllowed = (email, allowedDomains = module.exports.allowedEmailDomains) => {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();

  const match = normalized.match(/^[^\s@]+@([^\s@]+)$/);
  if (!match) return false;

  const domain = match[1].toLowerCase();
  return allowedDomains.includes(domain);
};
