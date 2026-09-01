import { v } from "convex/values";
import { query } from "./_generated/server";
import { workspaceBySlug } from "./lib/access";

export const weekly = query({
  args: { workspaceSlug: v.string() },
  returns: v.any(),
  handler: async (ctx, { workspaceSlug }) => {
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
    const rows = clusters.map((cluster) => ({
      cluster,
      score: scores.find((s) => s.clusterId === cluster._id),
      opportunity: opportunities.find((o) => o.clusterId === cluster._id),
    }));
    return {
      title: "India footwear signal report",
      period: "25–31 August 2026",
      demo: workspace.demo,
      executiveSummary:
        "Retro suede sneakers and comfort slippers show the cleanest estimated momentum. Clogs remain visible but are crowded, while high-shine formal shoes continue to weaken.",
      rising: rows
        .sort(
          (a, b) => (b.opportunity?.score ?? 0) - (a.opportunity?.score ?? 0),
        )
        .slice(0, 5),
      risks: rows
        .filter(
          (r) =>
            r.score?.stage === "declining" ||
            (r.opportunity?.saturation ?? 0) > 75,
        )
        .slice(0, 3),
      limitations: [
        "All findings in this report are synthetic demo data.",
        "No source supplies verified unit sales.",
        "Only two independent demo sources contribute to breadth.",
      ],
      generatedAt: "2026-08-31T10:00:00+05:30",
    };
  },
});
