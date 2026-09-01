import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalQuery } from "./_generated/server";
import {
  catalogStores,
  collectCatalog,
  type CatalogStoreKey,
} from "./lib/catalogCollectors";

export const targetWorkspaces = internalQuery({
  args: {},
  returns: v.array(v.id("workspaces")),
  handler: async (ctx) => {
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_demo", (q) => q.eq("demo", false))
      .take(50);
    return workspaces.map((workspace) => workspace._id);
  },
});

export const syncDaily = internalAction({
  args: {},
  returns: v.object({
    workspaces: v.number(),
    successfulSources: v.number(),
    failedSources: v.number(),
    inserted: v.number(),
    duplicates: v.number(),
  }),
  handler: async (ctx) => {
    const workspaceIds: Id<"workspaces">[] = await ctx.runQuery(
      internal.dailyPipeline.targetWorkspaces,
      {},
    );
    let successfulSources = 0;
    let failedSources = 0;
    let inserted = 0;
    let duplicates = 0;
    const stores = Object.keys(catalogStores) as CatalogStoreKey[];
    for (const workspaceId of workspaceIds) {
      for (const store of stores) {
        try {
          const rows = await collectCatalog(store, 100);
          const source = rows[0]?.source ?? store;
          const day = rows[0]?.observed_at.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
          const result: { inserted: number; duplicates: number } = await ctx.runMutation(
            internal.ingestion.importRowsInternal,
            {
              workspaceId,
              fileName: `${source}-${day}-scheduled.json`,
              rows,
            },
          );
          successfulSources += 1;
          inserted += result.inserted;
          duplicates += result.duplicates;
        } catch (error) {
          failedSources += 1;
          console.error(
            JSON.stringify({
              event: "daily_source_failed",
              workspaceId,
              store,
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          );
        }
      }
    }
    return {
      workspaces: workspaceIds.length,
      successfulSources,
      failedSources,
      inserted,
      duplicates,
    };
  },
});
