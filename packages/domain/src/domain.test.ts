import { describe, expect, it } from "vitest";
import {
  computeScores,
  exactMatch,
  inferAttributes,
  normaliseTitle,
  observationKey,
  parseObservationCsv,
  styleCompatible,
  type TimelinePoint,
} from ".";

const point = (
  day: number,
  rank: number,
  reviews: number,
  price = 1499,
  originalPrice = 1499,
  sizes = 6,
  source = "alpha",
): TimelinePoint => ({
  observedAt: `2026-08-${String(day).padStart(2, "0")}T00:00:00.000Z`,
  rank,
  surfaceSize: 100,
  reviewCount: reviews,
  price,
  originalPrice,
  availableSizes: sizes,
  source,
});
const supply = {
  listingGrowth: 30,
  brandCount: 35,
  deepDiscountShare: 20,
  density: 30,
};

describe("scoring", () => {
  it("marks insufficient history", () =>
    expect(computeScores([point(1, 50, 10)], supply).stage).toBe(
      "insufficient_history",
    ));
  it("detects genuine organic growth", () =>
    expect(
      computeScores(
        [point(1, 70, 10), point(10, 38, 24), point(20, 12, 55)],
        supply,
      ).trend,
    ).toBeGreaterThan(65));
  it("penalises discount-led rank movement", () =>
    expect(
      computeScores(
        [
          point(1, 70, 10, 1499, 1499),
          point(10, 35, 20, 1199, 1499),
          point(20, 10, 32, 899, 1499),
        ],
        supply,
      ).stage,
    ).toBe("discount_led"));
  it("does not let a temporary stock-out dominate", () =>
    expect(
      computeScores(
        [
          point(1, 40, 20, 1499, 1499, 6),
          point(10, 42, 21, 1499, 1499, 0),
          point(20, 43, 22, 1499, 1499, 6),
        ],
        supply,
      ).trend,
    ).toBeLessThan(68));
  it("does not treat low inventory alone as demand", () =>
    expect(
      computeScores(
        [
          point(1, 42, 20, 1499, 1499, 6),
          point(10, 43, 20, 1499, 1499, 3),
          point(20, 42, 21, 1499, 1499, 1),
        ],
        supply,
      ).trend,
    ).toBeLessThan(65));
  it("flags high saturation through the independent score", () =>
    expect(
      computeScores([point(1, 70, 10), point(10, 40, 22), point(20, 15, 45)], {
        listingGrowth: 95,
        brandCount: 90,
        deepDiscountShare: 90,
        density: 95,
      }).saturation,
    ).toBeGreaterThan(90));
  it("raises confidence for cross-platform agreement", () =>
    expect(
      computeScores(
        [
          point(1, 70, 10, 1499, 1499, 6, "a"),
          point(10, 40, 24, 1499, 1499, 5, "b"),
          point(20, 12, 50, 1499, 1499, 4, "c"),
        ],
        supply,
      ).confidence,
    ).toBeGreaterThan(75));
  it("detects decline", () =>
    expect(
      computeScores(
        [point(1, 10, 100), point(10, 35, 101), point(20, 75, 102)],
        supply,
      ).stage,
    ).toBe("declining"));
});

describe("ingestion and taxonomy", () => {
  it("returns understandable CSV errors", () =>
    expect(
      parseObservationCsv("source,title\ndemo,").errors.length,
    ).toBeGreaterThan(1));
  it("uses a deterministic idempotency key", () => {
    const result = parseObservationCsv(
      "source,source_product_id,url,title,brand,price,original_price,currency,rating,review_count,rank,category,availability,sizes_available,image_url,observed_at\ndemo,x,https://example.com/x,Retro shoe,Demo,999,1299,INR,4,10,5,casual,in_stock,7|8,,2026-08-31T00:00:00+05:30",
    );
    expect(observationKey(result.valid[0], "w")).toBe(
      observationKey(result.valid[0], "w"),
    );
  });
  it("understands India-specific slipper language", () =>
    expect(
      inferAttributes("Men's comfort chappal", "comfort").productType,
    ).toBe("slipper"));
  it("normalises punctuation and common colour spelling", () =>
    expect(normaliseTitle("Men's NAVY-BLUE Sneaker!!!")).toBe(
      "navy blue sneaker",
    ));
});

describe("product matching", () => {
  it("uses GTIN before title similarity", () => {
    const match = exactMatch(
      { gtin: "8901234567890", brand: "A", title: "One" },
      { gtin: "8901234567890", brand: "B", title: "Different" },
    );
    expect(match).toMatchObject({ matched: true, method: "gtin", score: 1 });
  });

  it("does not merge a sneaker and slipper into one style", () => {
    const sneaker = inferAttributes("Retro suede sneaker", "casual");
    const slipper = inferAttributes("Comfort chappal", "comfort");
    expect(styleCompatible(sneaker, slipper)).toBe(false);
  });
});
