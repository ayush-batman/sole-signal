import { v } from "convex/values";
import { query } from "./_generated/server";
import { workspaceBySlug } from "./lib/access";

export const answer = query({
  args: { workspaceSlug: v.string(), question: v.string() },
  returns: v.any(),
  handler: async (ctx, { workspaceSlug, question }) => {
    const workspace = await workspaceBySlug(ctx, workspaceSlug);
    const clusters = await ctx.db
      .query("styleClusters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .take(50);
    const scores = await ctx.db
      .query("trendScoresDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", workspace._id).eq("date", "2026-08-31"),
      )
      .take(50);
    const opportunities = await ctx.db
      .query("opportunityScoresDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", workspace._id).eq("date", "2026-08-31"),
      )
      .take(50);
    const terms = question.toLowerCase();
    const filtered = clusters
      .filter(
        (cluster) => !terms.includes("clog") || cluster.productType === "clog",
      )
      .map((cluster) => ({
        cluster,
        score: scores.find((s) => s.clusterId === cluster._id),
        opportunity: opportunities.find((o) => o.clusterId === cluster._id),
      }))
      .filter((item) =>
        terms.includes("declin")
          ? item.score?.stage === "declining"
          : terms.includes("under-supplied") || terms.includes("whitespace")
            ? (item.opportunity?.saturation ?? 100) < 50
            : true,
      )
      .sort((a, b) => (b.score?.score ?? 0) - (a.score?.score ?? 0))
      .slice(0, 3);
    const discountQuestion =
      terms.includes("organic") || terms.includes("discount");
    const lead = filtered[0];
    const response =
      discountQuestion && lead?.score?.stage === "discount_led"
        ? `${lead.cluster.name} is moving mainly through discounting, not clean organic momentum. Its score includes a discount penalty and should not be treated as unit sales.`
        : lead
          ? `${lead.cluster.name} is the strongest matching signal in the selected demo coverage. Its estimated Trend Score is ${lead.score?.score ?? "not available"}, with ${lead.opportunity?.saturation ?? "unknown"}% supply saturation.`
          : "No cluster in the current coverage matches all of those filters. Widen the category, price, or stage filter before making a decision.";
    return {
      answer: response,
      confidence: lead?.score?.confidence ?? 38,
      assumptions: [
        "The current workspace is a reproducible synthetic demo.",
        "Demand is estimated from rank, review, availability, breadth, and price signals; it is not unit sales.",
      ],
      filters: {
        country: "IN",
        date: "2026-08-31",
        interpretedTerms: terms.split(/\s+/).slice(0, 12),
      },
      toolCalls: [
        "searchStyleClusters",
        "getTrendEvidence",
        discountQuestion ? "compareDiscountSignals" : "findWhitespace",
      ],
      evidence: filtered.map((item) => ({
        title: item.cluster.name,
        score: item.score?.score,
        stage: item.score?.stage,
        opportunity: item.opportunity?.score,
        saturation: item.opportunity?.saturation,
        observedAt: "2026-08-31T10:00:00+05:30",
        sourceLinks: [
          `https://example.com/demo/${item.cluster.slug}/0`,
          `https://example.com/demo/${item.cluster.slug}/1`,
        ],
        explanation: item.score?.explanation,
      })),
    };
  },
});
