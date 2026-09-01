export type WindowObservation = {
  observedAt: number;
  price: number;
  originalPrice?: number;
  rank?: number;
  rankKind?:
    | "bestseller"
    | "marketplace_popularity"
    | "search_position"
    | "catalog_position";
  reviewCount?: number;
  sizesAvailable: string[];
  availability: string;
};

export type WindowTrend = {
  windowDays: 7 | 30 | 90 | 180;
  score: number | null;
  stage: "insufficient_history" | "rising" | "emerging" | "stable" | "declining" | "discount_led";
  confidence: number;
  evidenceDays: number;
  evidenceLevel: "insufficient" | "catalog" | "estimated" | "platform_ranked";
  evidenceSummary: string;
  explanation: string;
  components: {
    rankMomentum: number | null;
    reviewVelocity: number | null;
    availabilityPressure: number;
    priceResilience: number;
    discountPenalty: number;
  };
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const discountDepth = (item: WindowObservation) =>
  item.originalPrice && item.originalPrice > item.price
    ? (item.originalPrice - item.price) / item.originalPrice
    : 0;

const rankReliability = (kind: WindowObservation["rankKind"]): number => {
  if (kind === "bestseller") return 1;
  if (kind === "marketplace_popularity") return 0.75;
  if (kind === "search_position") return 0.45;
  if (kind === "catalog_position") return 0;
  return 0.35;
};

export function computeWindowTrend(
  start: WindowObservation,
  latest: WindowObservation,
  windowDays: 7 | 30 | 90 | 180,
): WindowTrend {
  const evidenceDays = Math.max(0, Math.round((latest.observedAt - start.observedAt) / 86_400_000));
  const coverage = clamp((evidenceDays / windowDays) * 100);
  const rankWeight = rankReliability(latest.rankKind ?? start.rankKind);
  const hasRank = start.rank != null && latest.rank != null && rankWeight > 0;
  const hasReviews = start.reviewCount != null && latest.reviewCount != null;
  const signalCoverage = 2 + (hasRank ? rankWeight : 0) + Number(hasReviews);
  const confidence = Math.round(clamp(coverage * 0.65 + (signalCoverage / 4) * 35));
  const rankMomentum = hasRank
    ? clamp(50 + ((start.rank! - latest.rank!) / Math.max(start.rank!, 1)) * 100)
    : null;
  const reviewDelta = hasReviews ? Math.max(0, latest.reviewCount! - start.reviewCount!) : null;
  const reviewVelocity = reviewDelta == null
    ? null
    : clamp((Math.log1p(reviewDelta) / Math.log(51)) * 100);
  const sizeLoss = start.sizesAvailable.length - latest.sizesAvailable.length;
  const availabilityPressure = clamp(45 + sizeLoss * 10 + (latest.availability === "out_of_stock" ? 25 : 0));
  const priceChange = (latest.price - start.price) / Math.max(start.price, 1);
  const priceResilience = clamp(65 + priceChange * 180);
  const discountPenalty = clamp((discountDepth(latest) - discountDepth(start)) * 180);
  const minimumDays = Math.max(5, Math.round(windowDays * 0.7));
  const components = {
    rankMomentum: rankMomentum == null ? null : Math.round(rankMomentum),
    reviewVelocity: reviewVelocity == null ? null : Math.round(reviewVelocity),
    availabilityPressure: Math.round(availabilityPressure),
    priceResilience: Math.round(priceResilience),
    discountPenalty: Math.round(discountPenalty),
  };
  if (evidenceDays < minimumDays) {
    return {
      windowDays,
      score: null,
      stage: "insufficient_history",
      confidence: Math.min(confidence, 49),
      evidenceDays,
      evidenceLevel: "insufficient",
      evidenceSummary: `${evidenceDays} real days; more history is required before ranking products.`,
      explanation: `${evidenceDays} of ${windowDays} days observed. The score will appear after ${minimumDays} real days.`,
      components,
    };
  }
  const weightedSignals: Array<[number, number]> = [
    [availabilityPressure, 0.2],
    [priceResilience, 0.2],
  ];
  if (rankMomentum != null)
    weightedSignals.push([rankMomentum, 0.35 * rankWeight]);
  if (reviewVelocity != null) weightedSignals.push([reviewVelocity, 0.25]);
  const totalWeight = weightedSignals.reduce((total, [, weight]) => total + weight, 0);
  const raw = weightedSignals.reduce((total, [value, weight]) => total + value * weight, 0) / totalWeight;
  const score = Math.round(clamp(raw - discountPenalty * 0.35));
  const stage =
    discountPenalty > 20 && (rankMomentum ?? 50) > 55
      ? "discount_led"
      : score >= 68
        ? "rising"
        : score >= 56
          ? "emerging"
          : score < 38
            ? "declining"
            : "stable";
  return {
    windowDays,
    score,
    stage,
    confidence,
    evidenceDays,
    evidenceLevel:
      latest.rankKind === "bestseller"
        ? "platform_ranked"
        : hasRank || hasReviews
          ? "estimated"
          : "catalog",
    evidenceSummary:
      latest.rankKind === "bestseller"
        ? "Platform bestseller rank plus observed price, reviews, and availability."
        : latest.rankKind === "marketplace_popularity"
          ? "Marketplace popularity position plus observed review, price, and stock movement; not confirmed sales."
          : latest.rankKind === "search_position"
            ? "Search visibility plus observed review, price, and stock movement; not confirmed sales."
            : "Observed price and stock movement only; not enough to call this a bestseller.",
    explanation: `Based on ${evidenceDays} real days of price, stock${hasRank ? ", rank" : ""}${hasReviews ? ", and review" : ""} movement.`,
    components,
  };
}
