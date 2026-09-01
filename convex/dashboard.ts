import { v } from "convex/values";
import { query } from "./_generated/server";
import { workspaceBySlug } from "./lib/access";

export const overview = query({
  args: { workspaceSlug: v.string() },
  returns: v.any(),
  handler: async (ctx, { workspaceSlug }) => {
    const workspace = await workspaceBySlug(ctx, workspaceSlug);
    const clusters = await ctx.db
      .query("styleClusters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .take(50);
    const scoreRows = await ctx.db
      .query("trendScoresDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", workspace._id).eq("date", "2026-08-31"),
      )
      .take(50);
    const opportunityRows = await ctx.db
      .query("opportunityScoresDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", workspace._id).eq("date", "2026-08-31"),
      )
      .take(50);
    const recommendations = await ctx.db
      .query("recommendations")
      .withIndex("by_workspace_and_created_at", (q) =>
        q.eq("workspaceId", workspace._id),
      )
      .order("desc")
      .take(5);
    const [workspaceProducts, workspaceListings, workspaceSnapshots] =
      await Promise.all([
        ctx.db
          .query("canonicalProducts")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .take(1000),
        ctx.db
          .query("productListings")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
          .take(1000),
        ctx.db
          .query("listingSnapshots")
          .withIndex("by_workspace_and_observed_at", (q) =>
            q.eq("workspaceId", workspace._id),
          )
          .order("desc")
          .take(1000),
      ]);
    const workspaceSourceIds = [
      ...new Set(workspaceListings.map((listing) => listing.sourceId)),
    ];
    const sources = (
      await Promise.all(
        workspaceSourceIds.map((sourceId) => ctx.db.get("sources", sourceId)),
      )
    ).filter((source) => source !== null);
    const scoreByCluster = new Map(
      scoreRows.map((row) => [row.clusterId, row]),
    );
    const opportunityByCluster = new Map(
      opportunityRows.map((row) => [row.clusterId, row]),
    );
    const cards = (
      await Promise.all(
        clusters.map(async (cluster) => {
          const members = await ctx.db
            .query("styleClusterMembers")
            .withIndex("by_cluster", (q) => q.eq("clusterId", cluster._id))
            .take(20);
          const products = await Promise.all(
            members.map((member) =>
              ctx.db.get("canonicalProducts", member.canonicalProductId),
            ),
          );
          const attributes = await Promise.all(
            products
              .filter((product) => product !== null)
              .map(
                async (product) =>
                  (
                    await ctx.db
                      .query("productAttributes")
                      .withIndex("by_product", (q) =>
                        q.eq("canonicalProductId", product._id),
                      )
                      .order("desc")
                      .take(1)
                  )[0] ?? null,
              ),
          );
          const listings = await Promise.all(
            products
              .filter((product) => product !== null)
              .map((product) =>
                ctx.db
                  .query("productListings")
                  .withIndex("by_canonical_product", (q) =>
                    q.eq("canonicalProductId", product._id),
                  )
                  .take(10),
              ),
          );
          const sourceIds = [
            ...new Set(listings.flat().map((listing) => listing.sourceId)),
          ];
          const sourceNames = (
            await Promise.all(
              sourceIds.map((sourceId) => ctx.db.get("sources", sourceId)),
            )
          )
            .filter((source) => source !== null)
            .map((source) => source.name);
          return {
            ...cluster,
            trend: scoreByCluster.get(cluster._id),
            opportunity: opportunityByCluster.get(cluster._id),
            audiences: [
              ...new Set(
                attributes
                  .map((attribute) => attribute?.attributes?.audience)
                  .filter((audience): audience is string => Boolean(audience)),
              ),
            ],
            platforms: sourceNames,
          };
        }),
      )
    ).filter((row) => row.trend);
    return {
      workspace,
      coverage: {
        observations: workspace.demo ? 72 : workspaceSnapshots.length,
        products: workspace.demo ? 12 : workspaceProducts.length,
        sources: workspace.demo ? 2 : sources.length,
        lastUpdated: workspace.demo
          ? "2026-08-31T10:00:00+05:30"
          : workspaceSnapshots[0]
            ? new Date(workspaceSnapshots[0].observedAt).toISOString()
            : null,
        label: workspace.demo ? "Demo data" : "Workspace data",
      },
      trends: cards,
      rising: cards
        .filter((row) => row.trend?.stage === "rising")
        .sort((a, b) => (b.trend?.score ?? 0) - (a.trend?.score ?? 0)),
      emerging: cards.filter((row) => row.trend?.stage === "emerging"),
      peaking: cards.filter((row) => row.trend?.stage === "peaking"),
      declining: cards.filter((row) => row.trend?.stage === "declining"),
      opportunities: cards
        .filter((row) => (row.opportunity?.score ?? 0) >= 70)
        .sort(
          (a, b) => (b.opportunity?.score ?? 0) - (a.opportunity?.score ?? 0),
        ),
      recommendations,
      sourceFreshness: sources
        .map((source) => ({
          _id: source._id,
          name: source.name,
          status: source.status,
          lastSuccessfulRunAt: source.lastSuccessfulRunAt,
          complianceStatus: source.complianceStatus,
        }))
        .slice(0, 8),
      alerts: workspace.demo
        ? [
            {
              severity: "high",
              title: "Clog saturation crossed 90",
              detail:
                "Demand remains visible, but supply density and discount share are now excessive.",
            },
            {
              severity: "medium",
              title: "Comfort slipper availability pressure",
              detail:
                "Two sizes disappeared during the latest synthetic observation window.",
            },
            {
              severity: "low",
              title: "Formal shoes moved to declining",
              detail:
                "Rank and review velocity weakened across the 30-day window.",
            },
          ]
        : [],
    };
  },
});
