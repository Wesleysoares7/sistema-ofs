export const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const includesNormalized = (source: string, query: string) =>
  normalizeText(source).includes(normalizeText(query.trim()));
