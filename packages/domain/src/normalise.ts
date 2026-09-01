export function normaliseTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(men s|women s|shoe|shoes|footwear)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function discountPercent(
  price: number,
  originalPrice: number | null,
): number {
  if (!originalPrice || originalPrice <= 0 || price >= originalPrice) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 1000) / 10;
}

export function indiaPriceBand(
  price: number,
): "value" | "mass" | "mid" | "premium" | "high_premium" {
  if (price < 800) return "value";
  if (price < 1500) return "mass";
  if (price < 3000) return "mid";
  if (price < 7000) return "premium";
  return "high_premium";
}

export function tokenSimilarity(a: string, b: string): number {
  const left = new Set(normaliseTitle(a).split(" ").filter(Boolean));
  const right = new Set(normaliseTitle(b).split(" ").filter(Boolean));
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}
