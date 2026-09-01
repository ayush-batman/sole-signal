import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const sources = await ctx.db.query("sources").take(100);
    const visibleSources = sources.filter(
      (source) =>
        source.key !== "campus-shoes" ||
        !sources.some((candidate) => candidate.key === "campus-ucp"),
    );
    return Promise.all(
      visibleSources.map(async (source) => ({
        ...source,
        healthEvents: await ctx.db
          .query("sourceHealthEvents")
          .withIndex("by_source_and_occurred_at", (q) =>
            q.eq("sourceId", source._id),
          )
          .order("desc")
          .take(3),
        crawlRuns: await ctx.db
          .query("crawlRuns")
          .withIndex("by_source_and_started_at", (q) =>
            q.eq("sourceId", source._id),
          )
          .order("desc")
          .take(3),
        metrics: source.key.startsWith("demo")
          ? {
              fetchSuccess: 100,
              extraction: 98,
              nullRate: 3,
              freshnessLagHours: source.key.endsWith("a") ? 1 : 1.5,
              duplicateRate: 1,
              rankCoverage: 100,
              imageCoverage: 92,
              reviewCoverage: 95,
              availabilityCoverage: 91,
            }
          : null,
      })),
    );
  },
});
