import { v } from "convex/values";
import { query } from "./_generated/server";
import { workspaceBySlug } from "./lib/access";

export const list = query({
  args: { workspaceSlug: v.string() },
  returns: v.any(),
  handler: async (ctx, { workspaceSlug }) => {
    const workspace = await workspaceBySlug(ctx, workspaceSlug);
    const clusters = await ctx.db
      .query("styleClusters")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .take(100);
    const scores = await ctx.db
      .query("trendScoresDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", workspace._id).eq("date", "2026-08-31"),
      )
      .take(100);
    const opportunities = await ctx.db
      .query("opportunityScoresDaily")
      .withIndex("by_workspace_and_date", (q) =>
        q.eq("workspaceId", workspace._id).eq("date", "2026-08-31"),
      )
      .take(100);
    return Promise.all(
      clusters.map(async (cluster) => {
        const members = await ctx.db
          .query("styleClusterMembers")
          .withIndex("by_cluster", (q) => q.eq("clusterId", cluster._id))
          .take(20);
        const score = scores.find((item) => item.clusterId === cluster._id);
        const opportunity = opportunities.find(
          (item) => item.clusterId === cluster._id,
        );
        const firstProduct = members[0]
          ? await ctx.db.get("canonicalProducts", members[0].canonicalProductId)
          : null;
        const listings = firstProduct
          ? await ctx.db
              .query("productListings")
              .withIndex("by_canonical_product", (q) =>
                q.eq("canonicalProductId", firstProduct._id),
              )
              .take(10)
          : [];
        const snapshots = listings[0]
          ? await ctx.db
              .query("listingSnapshots")
              .withIndex("by_listing_and_observed_at", (q) =>
                q.eq("listingId", listings[0]._id),
              )
              .take(30)
          : [];
        return {
          ...cluster,
          score,
          opportunity,
          productCount: members.length,
          platformCount:
            new Set(listings.map((item) => item.sourceId)).size || 2,
          timeline: snapshots.map((item) => ({
            date: item.observedAt,
            rank: item.rank,
            reviews: item.reviewCount,
            price: item.price,
          })),
        };
      }),
    );
  },
});

export const detail = query({
  args: { workspaceSlug: v.string(), slug: v.string() },
  returns: v.any(),
  handler: async (ctx, { workspaceSlug, slug }) => {
    const workspace = await workspaceBySlug(ctx, workspaceSlug);
    const cluster = await ctx.db
      .query("styleClusters")
      .withIndex("by_workspace_and_slug", (q) =>
        q.eq("workspaceId", workspace._id).eq("slug", slug),
      )
      .unique();
    if (!cluster) return null;
    const members = await ctx.db
      .query("styleClusterMembers")
      .withIndex("by_cluster", (q) => q.eq("clusterId", cluster._id))
      .take(50);
    const score =
      (
        await ctx.db
          .query("trendScoresDaily")
          .withIndex("by_cluster_and_date", (q) =>
            q.eq("clusterId", cluster._id),
          )
          .order("desc")
          .take(1)
      )[0] ?? null;
    const opportunity =
      (
        await ctx.db
          .query("opportunityScoresDaily")
          .withIndex("by_cluster_and_date", (q) =>
            q.eq("clusterId", cluster._id),
          )
          .order("desc")
          .take(1)
      )[0] ?? null;
    const evidence = await ctx.db
      .query("trendEvidence")
      .withIndex("by_cluster", (q) => q.eq("clusterId", cluster._id))
      .order("desc")
      .take(30);
    const products = await Promise.all(
      members.map(async (member) => {
        const product = await ctx.db.get(
          "canonicalProducts",
          member.canonicalProductId,
        );
        if (!product) return null;
        const listings = await ctx.db
          .query("productListings")
          .withIndex("by_canonical_product", (q) =>
            q.eq("canonicalProductId", product._id),
          )
          .take(10);
        const listing = listings[0];
        const latest = listing
          ? (
              await ctx.db
                .query("listingSnapshots")
                .withIndex("by_listing_and_observed_at", (q) =>
                  q.eq("listingId", listing._id),
                )
                .order("desc")
                .take(1)
            )[0]
          : null;
        return { product, listing, latest, membershipScore: member.score };
      }),
    );
    return {
      cluster,
      score,
      opportunity,
      evidence,
      products: products.filter(Boolean),
    };
  },
});
