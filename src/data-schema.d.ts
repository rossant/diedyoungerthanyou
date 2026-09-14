export const categories: string[];
export const genders: string[];
export const wikiSlugPattern: RegExp;
export function parseDate(value: string): {
  year: number;
  month: number;
  day: number;
};
export function ageAtDeath(born: string, died: string): number;
export function validateRawFields(fields: {
  id: string;
  name: string;
  born: string;
  died: string;
  nationality: string;
  category: string;
  gender: string;
  summary: string;
  wiki: string;
}): { errors: string[]; warnings: string[]; age: number };
