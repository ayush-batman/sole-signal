import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const clusters = [
  {
    slug: "retro-suede-gum",
    name: "Low-profile retro suede sneakers with gum sole",
    category: "casual",
    type: "sneaker",
    attrs: ["retro terrace", "suede", "gum sole", "low profile"],
    min: 1299,
    max: 3499,
    trend: 84,
    opportunity: 78,
    saturation: 41,
    confidence: 89,
    stage: "rising" as const,
    ranks: [68, 54, 39, 27, 16, 9],
    reviews: [120, 134, 153, 179, 214, 263],
    discount: 8,
  },
  {
    slug: "chunky-discount",
    name: "Chunky mesh sneakers with sculpted sole",
    category: "casual",
    type: "sneaker",
    attrs: ["chunky", "mesh", "dad shoe", "sculpted sole"],
    min: 999,
    max: 2499,
    trend: 63,
    opportunity: 42,
    saturation: 78,
    confidence: 82,
    stage: "discount_led" as const,
    ranks: [72, 55, 33, 19, 12, 8],
    reviews: [88, 96, 110, 126, 143, 160],
    discount: 44,
  },
  {
    slug: "comfort-slippers",
    name: "Cushioned comfort slippers with arch support",
    category: "comfort",
    type: "slipper",
    attrs: ["comfort first", "arch support", "cushioned", "wide fit"],
    min: 499,
    max: 1299,
    trend: 79,
    opportunity: 82,
    saturation: 30,
    confidence: 86,
    stage: "rising" as const,
    ranks: [49, 41, 31, 22, 15, 11],
    reviews: [240, 268, 305, 349, 401, 468],
    discount: 12,
  },
  {
    slug: "saturated-clogs",
    name: "EVA clogs with ventilation ports",
    category: "comfort",
    type: "clog",
    attrs: ["EVA", "ventilated", "comfort first", "moulded"],
    min: 399,
    max: 1999,
    trend: 70,
    opportunity: 38,
    saturation: 91,
    confidence: 91,
    stage: "peaking" as const,
    ranks: [42, 29, 19, 12, 10, 11],
    reviews: [330, 371, 421, 468, 501, 519],
    discount: 31,
  },
  {
    slug: "court-shoes",
    name: "Clean court-inspired leather sneakers",
    category: "casual",
    type: "sneaker",
    attrs: ["court inspired", "minimalist", "low top", "leather"],
    min: 1799,
    max: 4499,
    trend: 68,
    opportunity: 76,
    saturation: 34,
    confidence: 75,
    stage: "emerging" as const,
    ranks: [83, 76, 61, 47, 36, 28],
    reviews: [32, 38, 47, 60, 76, 98],
    discount: 5,
  },
  {
    slug: "formal-decline",
    name: "High-shine pointed formal oxfords",
    category: "formal",
    type: "oxford",
    attrs: ["formal", "pointed toe", "high shine", "lace up"],
    min: 1499,
    max: 3999,
    trend: 31,
    opportunity: 24,
    saturation: 64,
    confidence: 84,
    stage: "declining" as const,
    ranks: [18, 25, 34, 48, 62, 77],
    reviews: [410, 414, 417, 419, 421, 422],
    discount: 28,
  },
];

export const seedDemo = internalMutation({
  args: {},
  returns: v.object({
    workspaceId: v.id("workspaces"),
    clusters: v.number(),
    products: v.number(),
    snapshots: v.number(),
    alreadySeeded: v.boolean(),
  }),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", "demo-india"))
      .unique();
    if (existing)
      return {
        workspaceId: existing._id,
        clusters: 6,
        products: 12,
        snapshots: 72,
        alreadySeeded: true,
      };
    const now = Date.parse("2026-08-31T10:00:00+05:30");
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "India Footwear Demo",
      slug: "demo-india",
      country: "IN",
      currency: "INR",
      locale: "en-IN",
      timezone: "Asia/Kolkata",
      demo: true,
      createdAt: now,
    });
    await ctx.db.insert("businessProfiles", {
      workspaceId,
      businessType: "manufacturer",
      targetCustomer: "Urban Indian consumers aged 18–40",
      audiences: ["men", "women", "unisex"],
      categories: ["casual", "comfort", "performance"],
      priceBands: [
        { name: "Value", min: 0, max: 799 },
        { name: "Mass", min: 800, max: 1499 },
        { name: "Mid", min: 1500, max: 2999 },
        { name: "Premium", min: 3000, max: 6999 },
        { name: "High premium", min: 7000 },
      ],
      markets: ["IN"],
      competitors: ["Campus", "Bata", "Puma"],
      desiredGrossMargin: 55,
      normalMoq: 300,
      leadTimeDays: 45,
      riskTolerance: "medium",
      onboardingComplete: true,
      updatedAt: now,
    });
    await ctx.db.insert("scoringConfigs", {
      workspaceId,
      trendWeights: {
        rankMomentum: 25,
        rankStrength: 20,
        reviewVelocity: 15,
        availabilityPressure: 15,
        crossSourceBreadth: 10,
        searchMomentum: 10,
        priceResilience: 5,
      },
      saturationWeights: {
        listingGrowth: 40,
        brandCount: 25,
        deepDiscountShare: 20,
        density: 15,
      },
      opportunityWeights: {
        trend: 45,
        whitespace: 20,
        margin: 15,
        leadTime: 10,
        catalogue: 10,
      },
      minObservationCount: 3,
      minHistoryDays: 7,
      version: "v1",
      updatedAt: now,
    });
    const sourceDefs = [
      {
        key: "demo-market-a",
        name: "Demo Market A",
        status: "healthy" as const,
        publicAccess: false,
        compliance: "synthetic_only",
        weight: 0.8,
        last: now - 3_600_000,
      },
      {
        key: "demo-market-b",
        name: "Demo Market B",
        status: "healthy" as const,
        publicAccess: false,
        compliance: "synthetic_only",
        weight: 0.75,
        last: now - 5_400_000,
      },
      {
        key: "csv-import",
        name: "CSV Import",
        status: "healthy" as const,
        publicAccess: false,
        compliance: "user_provided",
        weight: 0.8,
        last: now - 7_200_000,
      },
      {
        key: "flipkart-affiliate",
        name: "Flipkart Affiliate",
        status: "not_connected" as const,
        publicAccess: false,
        compliance: "credentials_required",
        weight: 0.85,
        last: undefined,
      },
      {
        key: "approved-jsonld",
        name: "Approved public JSON-LD retailer",
        status: "planned" as const,
        publicAccess: true,
        compliance: "review_required",
        weight: 0.65,
        last: undefined,
      },
    ];
    const sourceIds = [];
    for (const source of sourceDefs)
      sourceIds.push(
        await ctx.db.insert("sources", {
          key: source.key,
          name: source.name,
          accessMethod:
            source.key === "csv-import"
              ? "csv"
              : source.key === "flipkart-affiliate"
                ? "affiliate_api"
                : "structured_data",
          credentialsRequired:
            source.key === "flipkart-affiliate"
              ? ["FLIPKART_AFFILIATE_ID", "FLIPKART_AFFILIATE_TOKEN"]
              : [],
          publicAccess: source.publicAccess,
          status: source.status,
          complianceStatus: source.compliance,
          reliabilityWeight: source.weight,
          lastSuccessfulRunAt: source.last,
          configuredIntervalHours: 24,
          demo: true,
        }),
      );
    await ctx.db.insert("sourceHealthEvents", {
      sourceId: sourceIds[0],
      occurredAt: now - 86_400_000,
      severity: "info",
      kind: "quality_ok",
      message: "Demo extraction quality is within publication thresholds.",
      metrics: {
        fetchSuccess: 1,
        extraction: 0.98,
        nullRate: 0.03,
        duplicateRate: 0.01,
        rankCoverage: 1,
        imageCoverage: 0.92,
        reviewCoverage: 0.95,
        availabilityCoverage: 0.91,
      },
    });
    let productCount = 0;
    let snapshotCount = 0;
    for (const [clusterIndex, cluster] of clusters.entries()) {
      const clusterId = await ctx.db.insert("styleClusters", {
        workspaceId,
        name: cluster.name,
        slug: cluster.slug,
        primaryCategory: cluster.category,
        productType: cluster.type,
        keyAttributes: cluster.attrs,
        priceMin: cluster.min,
        priceMax: cluster.max,
        imageUrls: [],
        demo: true,
        createdAt: now - 60 * 86_400_000,
      });
      const evidenceSnapshots = [];
      for (let productIndex = 0; productIndex < 2; productIndex += 1) {
        const brand =
          ["Northstar", "Kinetic", "EaseWalk", "Mould", "Baseline", "Regent"][
            clusterIndex
          ] + (productIndex ? " Co" : "");
        const title = `${brand} ${cluster.name.split(" ").slice(0, 5).join(" ")}`;
        const productId = await ctx.db.insert("canonicalProducts", {
          workspaceId,
          canonicalKey: `${cluster.slug}-${productIndex}`,
          title,
          brand,
          country: "IN",
          demo: true,
          firstSeenAt: now - 60 * 86_400_000,
          updatedAt: now,
        });
        productCount += 1;
        await ctx.db.insert("productAttributes", {
          workspaceId,
          canonicalProductId: productId,
          attributes: {
            audience: productIndex ? "women" : "men",
            primaryCategory: cluster.category,
            productType: cluster.type,
            sport: null,
            silhouette: cluster.attrs[0],
            primaryColour: productIndex ? "off white" : "navy",
            secondaryColours: [],
            aestheticTags: cluster.attrs
              .slice(0, 2)
              .map((a) => a.replaceAll(" ", "_")),
          },
          extractionMethod: "rule",
          modelVersion: "none",
          promptVersion: "taxonomy-rules-v1",
          confidence: 0.86,
          materialHash: `${cluster.slug}-${productIndex}`,
          humanCorrected: false,
          extractedAt: now,
        });
        await ctx.db.insert("styleClusterMembers", {
          workspaceId,
          clusterId,
          canonicalProductId: productId,
          score: 0.9 - productIndex * 0.04,
          method: "structured_attributes",
        });
        const sourceId = sourceIds[productIndex];
        const listingId = await ctx.db.insert("productListings", {
          workspaceId,
          canonicalProductId: productId,
          sourceId,
          sourceProductId: `${cluster.slug}-${productIndex}`,
          url: `https://example.com/demo/${cluster.slug}/${productIndex}`,
          title,
          brand,
          category: cluster.category,
          country: "IN",
          currency: "INR",
          locale: "en-IN",
          active: true,
          rawLatest: { synthetic: true },
          firstSeenAt: now - 60 * 86_400_000,
          lastObservedAt: now,
        });
        for (let i = 0; i < 6; i += 1) {
          const observedAt = now - (25 - i * 5) * 86_400_000;
          const price = Math.round(
            cluster.min +
              (cluster.max - cluster.min) * (productIndex ? 0.62 : 0.28),
          );
          const originalPrice = Math.round(
            price / (1 - cluster.discount / 100),
          );
          const snapshotId = await ctx.db.insert("listingSnapshots", {
            workspaceId,
            listingId,
            sourceId,
            idempotencyKey: `demo::${cluster.slug}::${productIndex}::${i}`,
            observedAt,
            ingestedAt: observedAt + 60_000,
            price,
            originalPrice,
            currency: "INR",
            rating: 4.1 + productIndex * 0.2,
            reviewCount: cluster.reviews[i] + productIndex * 13,
            rank: Math.min(100, cluster.ranks[i] + productIndex * 3),
            rankPercentile: 1 - (cluster.ranks[i] - 1) / 99,
            surfaceSize: 100,
            availability:
              i === 4 && cluster.slug === "comfort-slippers"
                ? "out_of_stock"
                : "in_stock",
            sizesAvailable:
              i === 4 && cluster.slug === "comfort-slippers"
                ? []
                : ["6", "7", "8", "9"].slice(
                    0,
                    Math.max(1, 4 - Math.floor(i / 2)),
                  ),
            raw: { synthetic: true, scenario: cluster.slug },
            demo: true,
          });
          snapshotCount += 1;
          if (i === 5)
            evidenceSnapshots.push({
              snapshotId,
              listingId,
              sourceId,
              url: `https://example.com/demo/${cluster.slug}/${productIndex}`,
              observedAt,
            });
        }
      }
      const trendScoreId = await ctx.db.insert("trendScoresDaily", {
        workspaceId,
        clusterId,
        date: "2026-08-31",
        score: cluster.trend,
        stage: cluster.stage,
        confidence: cluster.confidence,
        version: "trend-v1",
        components: {
          rankMomentum: Math.min(96, cluster.trend + 8),
          rankStrength: cluster.trend,
          reviewVelocity: Math.max(22, cluster.trend - 4),
          availabilityPressure: cluster.slug === "comfort-slippers" ? 82 : 56,
          crossSourceBreadth: 76,
          searchMomentum: 50,
          priceResilience: 100 - cluster.discount,
          discountPenalty: cluster.stage === "discount_led" ? 42 : 0,
        },
        evidenceSnapshotIds: evidenceSnapshots.map((e) => e.snapshotId),
        explanation:
          cluster.stage === "discount_led"
            ? "Rank improved while discount depth rose to 44%; the score is penalised as discount-led."
            : cluster.stage === "declining"
              ? "Rank and review velocity weakened across the observation window."
              : "Estimated demand strengthened across two synthetic sources while price and review signals were monitored separately.",
      });
      await ctx.db.insert("opportunityScoresDaily", {
        workspaceId,
        clusterId,
        date: "2026-08-31",
        score: cluster.opportunity,
        saturation: cluster.saturation,
        version: "opportunity-v1",
        components: {
          trend: cluster.trend,
          whitespace: 100 - cluster.saturation,
          marginFit: 72,
          leadTimeFit: 68,
          catalogueFit: 74,
        },
      });
      const evidenceIds = [];
      for (const evidence of evidenceSnapshots)
        evidenceIds.push(
          await ctx.db.insert("trendEvidence", {
            workspaceId,
            clusterId,
            trendScoreId,
            sourceId: evidence.sourceId,
            listingId: evidence.listingId,
            snapshotId: evidence.snapshotId,
            observedAt: evidence.observedAt,
            kind: "latest_observation",
            summary: `Rank and review observation supporting ${cluster.stage.replace("_", " ")} classification.`,
            sourceUrl: evidence.url,
          }),
        );
      const action =
        cluster.opportunity >= 75
          ? "test"
          : cluster.saturation >= 80
            ? "avoid"
            : cluster.stage === "declining"
              ? "discount"
              : "watch";
      await ctx.db.insert("recommendations", {
        workspaceId,
        clusterId,
        action,
        title: `${action[0].toUpperCase()}${action.slice(1)} ${cluster.name.toLowerCase()}`,
        rationale:
          cluster.opportunity >= 75
            ? "Demand is strengthening and supply saturation remains manageable for the demo business constraints."
            : cluster.saturation >= 80
              ? "Demand exists, but similar listing density and discount share make the whitespace unattractive."
              : "Keep the style under observation until evidence strengthens.",
        confidence: cluster.confidence,
        evidenceIds,
        assumptions: [
          "Demand is estimated from marketplace observations, not unit sales.",
          "Margin fit uses the demo business profile.",
        ],
        createdAt: now - clusterIndex * 1000,
        status: "active",
      });
    }
    return {
      workspaceId,
      clusters: clusters.length,
      products: productCount,
      snapshots: snapshotCount,
      alreadySeeded: false,
    };
  },
});

export const activateCaiSource = internalMutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const source = await ctx.db
      .query("sources")
      .withIndex("by_key", (q) => q.eq("key", "approved-jsonld"))
      .unique();
    if (!source) return false;
    await ctx.db.patch("sources", source._id, {
      key: "cai-store-public",
      name: "The CAI Store public catalog",
      accessMethod: "permitted_product_json",
      status: "healthy",
      complianceStatus: "robots_and_agents_md_allowed_2026_08_31",
      lastSuccessfulRunAt: Date.parse("2026-08-31T12:32:28+05:30"),
      latestError: undefined,
    });
    await ctx.db.insert("sourceHealthEvents", {
      sourceId: source._id,
      occurredAt: Date.parse("2026-08-31T12:32:28+05:30"),
      severity: "info",
      kind: "live_smoke_test_passed",
      message:
        "Live category discovery and five product observations passed using endpoints explicitly permitted by the source's agents.md.",
      metrics: {
        fetched: 5,
        extracted: 5,
        extractionRate: 1,
        robotsAllowed: true,
        permissionDocument: "https://thecaistore.com/agents.md",
      },
    });
    return true;
  },
});

const plannedSources = [
  [
    "amazon-india",
    "Amazon India",
    "approved_api_or_affiliate",
    ["APPROVED_API_CREDENTIALS"],
  ],
  ["myntra", "Myntra", "approved_partner_feed", ["PARTNER_APPROVAL"]],
  ["ajio", "AJIO", "approved_partner_feed", ["PARTNER_APPROVAL"]],
  ["tata-cliq", "Tata CLiQ", "approved_partner_feed", ["PARTNER_APPROVAL"]],
  [
    "nykaa-fashion",
    "Nykaa Fashion",
    "approved_partner_feed",
    ["PARTNER_APPROVAL"],
  ],
  ["meesho", "Meesho", "approved_partner_feed", ["PARTNER_APPROVAL"]],
  ["shopsy", "Shopsy", "approved_partner_feed", ["PARTNER_APPROVAL"]],
  ["adidas-india", "Adidas India", "public_catalog_after_review", []],
  ["puma-india", "Puma India", "public_catalog_after_review", []],
  ["bata-india", "Bata", "public_catalog_after_review", []],
  ["veg-non-veg", "VegNonVeg", "public_catalog_after_review", []],
  ["superkicks", "Superkicks", "public_catalog_after_review", []],
  [
    "google-trends",
    "Google Trends",
    "approved_api",
    ["GOOGLE_API_CREDENTIALS"],
  ],
  [
    "google-shopping",
    "Google Shopping",
    "approved_api",
    ["GOOGLE_API_CREDENTIALS"],
  ],
] as const;

export const seedPlannedSources = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let inserted = 0;
    for (const [
      key,
      name,
      accessMethod,
      credentialsRequired,
    ] of plannedSources) {
      const existing = await ctx.db
        .query("sources")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existing) continue;
      await ctx.db.insert("sources", {
        key,
        name,
        accessMethod,
        credentialsRequired: [...credentialsRequired],
        publicAccess: accessMethod.startsWith("public_catalog"),
        status: "planned",
        complianceStatus: "disabled_pending_permission_and_fixture_review",
        reliabilityWeight: 0.5,
        configuredIntervalHours: 24,
        demo: false,
      });
      inserted += 1;
    }
    return inserted;
  },
});
