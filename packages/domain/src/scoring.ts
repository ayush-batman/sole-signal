export type TimelinePoint = {
  observedAt: string;
  rank: number | null;
  surfaceSize: number | null;
  reviewCount: number | null;
  price: number;
  originalPrice: number | null;
  availableSizes: number;
  source: string;
};

export type ScoreResult = {
  trend: number | null;
  saturation: number;
  opportunity: number | null;
  confidence: number;
  stage:
    | "insufficient_history"
    | "emerging"
    | "rising"
    | "peaking"
    | "declining"
    | "discount_led"
    | "stable";
  components: Record<string, number | null>;
  explanation: string;
  version: "trend-v1";
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const rankStrength = (rank: number | null, size: number | null) =>
  rank == null
    ? null
    : clamp(100 * (1 - (rank - 1) / Math.max(size ?? Math.max(rank, 100), 1)));

export function computeScores(
  timeline: TimelinePoint[],
  supply: {
    listingGrowth: number;
    brandCount: number;
    deepDiscountShare: number;
    density: number;
  },
  fit = { margin: 70, leadTime: 70, catalogue: 70 },
): ScoreResult {
  const points = [...timeline].sort(
    (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
  );
  const days =
    points.length > 1
      ? (Date.parse(points.at(-1)!.observedAt) -
          Date.parse(points[0].observedAt)) /
        86_400_000
      : 0;
  const last = points.at(-1);
  const first = points[0];
  const coverage = clamp((points.length / 8) * 60 + (days / 30) * 40);
  const sources = new Set(points.map((p) => p.source)).size;
  const confidence = clamp(30 + coverage * 0.45 + Math.min(sources, 3) * 8);
  const saturation = clamp(
    supply.listingGrowth * 0.4 +
      supply.brandCount * 0.25 +
      supply.deepDiscountShare * 0.2 +
      supply.density * 0.15,
  );
  if (!first || !last || points.length < 3 || days < 7) {
    return {
      trend: null,
      saturation,
      opportunity: null,
      confidence: Math.min(confidence, 45),
      stage: "insufficient_history",
      components: {
        rankMomentum: null,
        rankStrength: null,
        reviewVelocity: null,
        availabilityPressure: null,
        crossSourceBreadth: null,
        searchMomentum: null,
        priceResilience: null,
      },
      explanation:
        "Insufficient history: at least three observations across seven days are required.",
      version: "trend-v1",
    };
  }
  const firstStrength = rankStrength(first.rank, first.surfaceSize);
  const currentStrength = rankStrength(last.rank, last.surfaceSize);
  const rankMomentum =
    firstStrength == null || currentStrength == null
      ? 50
      : clamp(50 + (currentStrength - firstStrength) * 1.4);
  const reviewDelta = Math.max(
    0,
    (last.reviewCount ?? 0) - (first.reviewCount ?? 0),
  );
  const reviewVelocity = clamp((Math.log1p(reviewDelta) / Math.log(51)) * 100);
  const availabilityPressure = clamp(100 - last.availableSizes * 9);
  const crossSourceBreadth = clamp((sources / 3) * 100);
  const searchMomentum = 50;
  const priceChange = (last.price - first.price) / Math.max(first.price, 1);
  const priceResilience = clamp(70 + priceChange * 160);
  const firstDiscount =
    first.originalPrice && first.originalPrice > first.price
      ? (first.originalPrice - first.price) / first.originalPrice
      : 0;
  const lastDiscount =
    last.originalPrice && last.originalPrice > last.price
      ? (last.originalPrice - last.price) / last.originalPrice
      : 0;
  const discountPenalty = clamp((lastDiscount - firstDiscount) * 150);
  const weighted =
    rankMomentum * 0.25 +
    (currentStrength ?? 50) * 0.2 +
    reviewVelocity * 0.15 +
    availabilityPressure * 0.15 +
    crossSourceBreadth * 0.1 +
    searchMomentum * 0.1 +
    priceResilience * 0.05;
  const trend = clamp(weighted - discountPenalty * 0.35);
  const whitespace = 100 - saturation;
  const opportunity = clamp(
    trend * 0.45 +
      whitespace * 0.2 +
      fit.margin * 0.15 +
      fit.leadTime * 0.1 +
      fit.catalogue * 0.1,
  );
  const discountLed = discountPenalty > 22 && rankMomentum > 55;
  const stage = discountLed
    ? "discount_led"
    : trend >= 75 && rankMomentum < 58
      ? "peaking"
      : trend >= 68
        ? "rising"
        : trend >= 56
          ? "emerging"
          : trend < 38
            ? "declining"
            : "stable";
  return {
    trend: Math.round(trend),
    saturation: Math.round(saturation),
    opportunity: Math.round(opportunity),
    confidence: Math.round(confidence),
    stage,
    components: {
      rankMomentum: Math.round(rankMomentum),
      rankStrength:
        currentStrength == null ? null : Math.round(currentStrength),
      reviewVelocity: Math.round(reviewVelocity),
      availabilityPressure: Math.round(availabilityPressure),
      crossSourceBreadth: Math.round(crossSourceBreadth),
      searchMomentum,
      priceResilience: Math.round(priceResilience),
      discountPenalty: Math.round(discountPenalty),
    },
    explanation: discountLed
      ? "Rank improved while discount depth increased materially; the movement is penalised as discount-led."
      : `Estimated demand is ${stage.replace("_", " ")} across ${sources} source${sources === 1 ? "" : "s"}, with price resilience included.`,
    version: "trend-v1",
  };
}
