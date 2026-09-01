import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireWorkspace } from "./lib/access";
import { inferAttributes, normaliseTitle } from "../packages/domain/src";
import type { Id } from "./_generated/dataModel";

const row = v.object({
  source: v.string(),
  source_product_id: v.string(),
  url: v.string(),
  title: v.string(),
  brand: v.string(),
  price: v.number(),
  original_price: v.union(v.number(), v.null()),
  currency: v.string(),
  rating: v.union(v.number(), v.null()),
  review_count: v.union(v.number(), v.null()),
  rank: v.union(v.number(), v.null()),
  category: v.string(),
  availability: v.string(),
  sizes_available: v.array(v.string()),
  image_url: v.union(v.string(), v.null()),
  observed_at: v.string(),
});

export const importRowsInternal = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    fileName: v.string(),
    rows: v.array(row),
    userId: v.optional(v.id("users")),
  },
  returns: v.object({
    inserted: v.number(),
    duplicates: v.number(),
    importRunId: v.id("importRuns"),
  }),
  handler: async (ctx, { workspaceId, fileName, rows, userId }) => {
    if (!(await ctx.db.get("workspaces", workspaceId))) {
      throw new Error("Workspace not found.");
    }
    if (rows.length > 1000)
      throw new Error("Import at most 1,000 rows per batch.");
    const importRunId = await ctx.db.insert("importRuns", {
      workspaceId,
      userId,
      fileName,
      startedAt: Date.now(),
      totalRows: rows.length,
      insertedRows: 0,
      duplicateRows: 0,
      invalidRows: 0,
      errors: [],
      status: "validating",
    });
    let inserted = 0;
    let duplicates = 0;
    const touchedSourceIds = new Set<Id<"sources">>();
    for (const item of rows) {
      const observedAt = Date.parse(item.observed_at);
      const idempotencyKey = [
        workspaceId,
        item.source.toLowerCase(),
        item.source_product_id,
        new Date(observedAt).toISOString(),
        "IN",
      ].join("::");
      if (
        await ctx.db
          .query("listingSnapshots")
          .withIndex("by_idempotency_key", (q) =>
            q.eq("idempotencyKey", idempotencyKey),
          )
          .unique()
      ) {
        const existingSource = await ctx.db
          .query("sources")
          .withIndex("by_key", (q) => q.eq("key", item.source.toLowerCase()))
          .unique();
        if (existingSource) touchedSourceIds.add(existingSource._id);
        duplicates += 1;
        continue;
      }
      let source = await ctx.db
        .query("sources")
        .withIndex("by_key", (q) => q.eq("key", item.source.toLowerCase()))
        .unique();
      if (!source) {
        const sourceKey = item.source.toLowerCase();
        const publicConfig: Record<
          string,
          { name: string; method: string; compliance: string; weight: number }
        > = {
          "campus-ucp": {
            name: "Campus Shoes UCP",
            method: "ucp_mcp",
            compliance: "explicit_read_only_ucp",
            weight: 0.75,
          },
          "cai-store-public": {
            name: "The CAI Store public catalog",
            method: "public_json",
            compliance: "explicit_read_only_json",
            weight: 0.65,
          },
          "neemans-ucp": {
            name: "Neeman's UCP",
            method: "ucp_mcp",
            compliance: "explicit_read_only_ucp",
            weight: 0.75,
          },
          "redtape-ucp": {
            name: "RedTape UCP",
            method: "ucp_mcp",
            compliance: "explicit_read_only_ucp",
            weight: 0.75,
          },
          "inc5-ucp": {
            name: "INC.5 UCP",
            method: "ucp_mcp",
            compliance: "explicit_read_only_ucp",
            weight: 0.75,
          },
        };
        const config = publicConfig[sourceKey];
        const sourceId = await ctx.db.insert("sources", {
          key: sourceKey,
          name: config?.name ?? item.source,
          accessMethod: config?.method ?? "csv",
          credentialsRequired: [],
          publicAccess: Boolean(config),
          status: "healthy",
          complianceStatus: config?.compliance ?? "user_provided",
          reliabilityWeight: config?.weight ?? 0.8,
          lastSuccessfulRunAt: Date.now(),
          configuredIntervalHours: 24,
          demo: false,
        });
        source = (await ctx.db.get("sources", sourceId))!;
      }
      touchedSourceIds.add(source._id);
      const canonicalKey = `${item.brand.toLowerCase()}::${normaliseTitle(item.title)}`;
      let product = await ctx.db
        .query("canonicalProducts")
        .withIndex("by_workspace_and_key", (q) =>
          q.eq("workspaceId", workspaceId).eq("canonicalKey", canonicalKey),
        )
        .unique();
      if (!product) {
        const productId = await ctx.db.insert("canonicalProducts", {
          workspaceId,
          canonicalKey,
          title: item.title,
          brand: item.brand,
          country: "IN",
          demo: false,
          firstSeenAt: observedAt,
          updatedAt: Date.now(),
        });
        product = (await ctx.db.get("canonicalProducts", productId))!;
        await ctx.db.insert("productAttributes", {
          workspaceId,
          canonicalProductId: productId,
          attributes: inferAttributes(item.title, item.category),
          extractionMethod: "rule",
          confidence: 0.72,
          materialHash: canonicalKey,
          humanCorrected: false,
          extractedAt: Date.now(),
        });
      }
      let listing = await ctx.db
        .query("productListings")
        .withIndex("by_workspace_and_source_product", (q) =>
          q
            .eq("workspaceId", workspaceId)
            .eq("sourceId", source!._id)
            .eq("sourceProductId", item.source_product_id),
        )
        .unique();
      if (!listing) {
        const listingId = await ctx.db.insert("productListings", {
          workspaceId,
          canonicalProductId: product._id,
          sourceId: source._id,
          sourceProductId: item.source_product_id,
          url: item.url,
          title: item.title,
          brand: item.brand,
          category: item.category,
          country: "IN",
          currency: item.currency,
          locale: "en-IN",
          imageUrl: item.image_url ?? undefined,
          active: item.availability !== "out_of_stock",
          rawLatest: item,
          firstSeenAt: observedAt,
          lastObservedAt: observedAt,
        });
        listing = (await ctx.db.get("productListings", listingId))!;
      } else
        await ctx.db.patch("productListings", listing._id, {
          lastObservedAt: observedAt,
          active: item.availability !== "out_of_stock",
          rawLatest: item,
          imageUrl: item.image_url ?? undefined,
        });
      const snapshotId = await ctx.db.insert("listingSnapshots", {
        workspaceId,
        listingId: listing._id,
        sourceId: source._id,
        idempotencyKey,
        observedAt,
        ingestedAt: Date.now(),
        price: item.price,
        originalPrice: item.original_price ?? undefined,
        currency: item.currency,
        rating: item.rating ?? undefined,
        reviewCount: item.review_count ?? undefined,
        rank: item.rank ?? undefined,
        availability: item.availability,
        sizesAvailable: item.sizes_available,
        raw: item,
        demo: false,
      });
      for (const size of item.sizes_available)
        await ctx.db.insert("sizeAvailabilitySnapshots", {
          workspaceId,
          listingSnapshotId: snapshotId,
          listingId: listing._id,
          observedAt,
          size,
          available: true,
        });
      inserted += 1;
    }
    await ctx.db.patch("importRuns", importRunId, {
      finishedAt: Date.now(),
      insertedRows: inserted,
      duplicateRows: duplicates,
      status: "completed",
    });
    for (const sourceId of touchedSourceIds)
      await ctx.db.patch("sources", sourceId, {
        status: "healthy",
        lastSuccessfulRunAt: Date.now(),
        latestError: undefined,
      });
    return { inserted, duplicates, importRunId };
  },
});

export const importRows = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    fileName: v.string(),
    rows: v.array(row),
  },
  returns: v.object({
    inserted: v.number(),
    duplicates: v.number(),
    importRunId: v.id("importRuns"),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    inserted: number;
    duplicates: number;
    importRunId: Id<"importRuns">;
  }> => {
    const { userId } = await requireWorkspace(ctx, args.workspaceId);
    const result: {
      inserted: number;
      duplicates: number;
      importRunId: Id<"importRuns">;
    } = await ctx.runMutation(internal.ingestion.importRowsInternal, {
      ...args,
      userId,
    });
    return result;
  },
});

export const recentRuns = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.any(),
  handler: async (ctx, { workspaceId }) => {
    await requireWorkspace(ctx, workspaceId);
    return ctx.db
      .query("importRuns")
      .withIndex("by_workspace_and_started_at", (q) =>
        q.eq("workspaceId", workspaceId),
      )
      .order("desc")
      .take(20);
  },
});
