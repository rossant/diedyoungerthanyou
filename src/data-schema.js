// Shared by the Vite data loader and the Node validation script. Keep this
// module free of browser- or Node-specific APIs.
export const categories = [
  "science",
  "mathematics",
  "engineering",
  "music",
  "art",
  "literature",
  "film",
  "activism",
  "politics",
  "exploration",
];

export const genders = ["woman", "man", "nonbinary", "unknown"];

export function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid date: ${value}`);
  const year = Number(match[1]),
    month = Number(match[2]),
    day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${value}`);
  }
  return { year, month, day };
}

export function ageAtDeath(born, died) {
  const birth = parseDate(born);
  const death = parseDate(died);
  return (
    death.year -
    birth.year -
    (death.month < birth.month ||
    (death.month === birth.month && death.day < birth.day)
      ? 1
      : 0)
  );
}

// Wikipedia article titles may contain Unicode letters, numbers, spaces encoded
// as underscores, punctuation and parenthetical disambiguators, but no URL path.
export const wikiSlugPattern = /^[\p{L}\p{N}][\p{L}\p{N}_().,'’:&-]*$/u;

export function validateRawFields({
  id,
  name,
  born,
  died,
  nationality,
  category,
  gender,
  summary,
  wiki,
}) {
  const errors = [];
  if (!/^[a-z0-9-]+$/.test(id)) errors.push(`invalid id ${id}`);
  if (!name.trim() || !nationality.trim() || !summary.trim() || !wiki.trim())
    errors.push("empty required field");
  if (!categories.includes(category))
    errors.push(`unknown category ${category}`);
  if (!genders.includes(gender)) errors.push(`invalid gender ${gender}`);
  const warnings = [];
  if (summary.length < 40 || summary.length > 180)
    warnings.push(`summary length ${summary.length} (target 40–180)`);
  if (!wikiSlugPattern.test(wiki))
    errors.push(`invalid Wikipedia slug ${wiki}`);
  let age;
  try {
    age = ageAtDeath(born, died);
  } catch (error) {
    errors.push(error.message);
  }
  if (age !== undefined && (age < 0 || age > 120))
    errors.push(`implausible age ${age}`);
  return { errors, warnings, age };
}
