import { tokenSimilarity } from "./normalise";
import type { FootwearAttributes } from "./taxonomy";

export type MatchCandidate = {
  gtin?: string | null;
  brandSku?: string | null;
  brand: string;
  model?: string | null;
  colourway?: string | null;
  title: string;
};

export function exactMatch(
  a: MatchCandidate,
  b: MatchCandidate,
): { matched: boolean; method: string; score: number; evidence: string[] } {
  if (a.gtin && b.gtin && a.gtin === b.gtin)
    return {
      matched: true,
      method: "gtin",
      score: 1,
      evidence: [`GTIN ${a.gtin}`],
    };
  if (
    a.brandSku &&
    b.brandSku &&
    a.brand.toLowerCase() === b.brand.toLowerCase() &&
    a.brandSku.toLowerCase() === b.brandSku.toLowerCase()
  )
    return {
      matched: true,
      method: "brand_sku",
      score: 0.98,
      evidence: [`${a.brand} SKU ${a.brandSku}`],
    };
  if (
    a.model &&
    b.model &&
    a.colourway &&
    b.colourway &&
    a.brand.toLowerCase() === b.brand.toLowerCase() &&
    a.model.toLowerCase() === b.model.toLowerCase() &&
    a.colourway.toLowerCase() === b.colourway.toLowerCase()
  )
    return {
      matched: true,
      method: "brand_model_colourway",
      score: 0.94,
      evidence: [a.brand, a.model, a.colourway],
    };
  const score = tokenSimilarity(a.title, b.title);
  return {
    matched: score >= 0.86 && a.brand.toLowerCase() === b.brand.toLowerCase(),
    method: "normalised_title",
    score,
    evidence: [`Title token similarity ${Math.round(score * 100)}%`],
  };
}

export function styleCompatible(
  a: FootwearAttributes,
  b: FootwearAttributes,
): boolean {
  if (a.primaryCategory !== b.primaryCategory) return false;
  const sharedTags = a.aestheticTags.filter((tag) =>
    b.aestheticTags.includes(tag),
  ).length;
  return (
    a.productType === b.productType &&
    (a.silhouette === b.silhouette || sharedTags > 0) &&
    (a.upperMaterial === b.upperMaterial ||
      !a.upperMaterial ||
      !b.upperMaterial)
  );
}

export function styleName(attributes: FootwearAttributes): string {
  const tags = attributes.aestheticTags
    .slice(0, 1)
    .map((tag) => tag.replaceAll("_", " "));
  return [
    attributes.silhouette,
    ...tags,
    attributes.upperMaterial,
    attributes.primaryColour,
    attributes.productType.replaceAll("_", " "),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
