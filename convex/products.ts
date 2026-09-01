import { v } from "convex/values";
import { query } from "./_generated/server";
import { workspaceBySlug } from "./lib/access";

export const list = query({
  args: { workspaceSlug: v.string() },
  returns: v.any(),
  handler: async (ctx, { workspaceSlug }) => {
    const workspace = await workspaceBySlug(ctx, workspaceSlug);
    const listings = await ctx.db
      .query("productListings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .order("desc")
      .take(200);
    return Promise.all(
      listings.map(async (listing) => {
        const product = await ctx.db.get(
          "canonicalProducts",
          listing.canonicalProductId,
        );
        const source = await ctx.db.get("sources", listing.sourceId);
        const snapshots = await ctx.db
          .query("listingSnapshots")
          .withIndex("by_listing_and_observed_at", (q) =>
            q.eq("listingId", listing._id),
          )
          .order("desc")
          .take(2);
        const latest = snapshots[0] ?? null;
        const previous = snapshots[1] ?? null;
        const membership = (
          await ctx.db
            .query("styleClusterMembers")
            .withIndex("by_product", (q) =>
              q.eq("canonicalProductId", listing.canonicalProductId),
            )
            .take(1)
        )[0];
        const score = membership
          ? (
              await ctx.db
                .query("trendScoresDaily")
                .withIndex("by_cluster_and_date", (q) =>
                  q.eq("clusterId", membership.clusterId),
                )
                .order("desc")
                .take(1)
            )[0]
          : null;
        return {
          listing,
          product,
          source,
          latest,
          previous,
          score,
          rankChange:
            latest?.rank != null && previous?.rank != null
              ? previous.rank - latest.rank
              : null,
          reviewChange:
            latest?.reviewCount != null && previous?.reviewCount != null
              ? latest.reviewCount - previous.reviewCount
              : null,
        };
      }),
    );
  },
});

export const detail = query({
  args: { workspaceSlug: v.string(), productId: v.id("canonicalProducts") },
  returns: v.any(),
  handler: async (ctx, { workspaceSlug, productId }) => {
    const workspace = await workspaceBySlug(ctx, workspaceSlug);
    const product = await ctx.db.get("canonicalProducts", productId);
    if (!product || product.workspaceId !== workspace._id) return null;
    const listings = await ctx.db
      .query("productListings")
      .withIndex("by_canonical_product", (q) =>
        q.eq("canonicalProductId", productId),
      )
      .take(30);
    const listingDetails = await Promise.all(
      listings.map(async (listing) => ({
        listing,
        source: await ctx.db.get("sources", listing.sourceId),
        snapshots: await ctx.db
          .query("listingSnapshots")
          .withIndex("by_listing_and_observed_at", (q) =>
            q.eq("listingId", listing._id),
          )
          .order("asc")
          .take(100),
      })),
    );
    const attributes =
      (
        await ctx.db
          .query("productAttributes")
          .withIndex("by_product", (q) => q.eq("canonicalProductId", productId))
          .order("desc")
          .take(1)
      )[0] ?? null;
    const membership =
      (
        await ctx.db
          .query("styleClusterMembers")
          .withIndex("by_product", (q) => q.eq("canonicalProductId", productId))
          .take(1)
      )[0] ?? null;
    const cluster = membership
      ? await ctx.db.get("styleClusters", membership.clusterId)
      : null;
    const matches = await ctx.db
      .query("exactProductMatches")
      .withIndex("by_left_product", (q) => q.eq("leftProductId", productId))
      .take(30);
    return {
      product,
      listings: listingDetails,
      attributes,
      membership,
      cluster,
      matches,
    };
  },
});
