import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { action } from "./_generated/server";
import {
  collectCatalog,
  type CatalogStoreKey,
} from "./lib/catalogCollectors";

const syncResult = v.object({
  inserted: v.number(),
  duplicates: v.number(),
  importRunId: v.id("importRuns"),
});

async function syncStore(
  ctx: ActionCtx,
  workspaceId: Id<"workspaces">,
  store: CatalogStoreKey,
  limit?: number,
): Promise<{
  inserted: number;
  duplicates: number;
  importRunId: Id<"importRuns">;
}> {
  if (!(await getAuthUserId(ctx))) {
    throw new Error("Sign in with GitHub to sync live data.");
  }
  const rows = await collectCatalog(store, limit ?? 100);
  const source = rows[0]?.source ?? store;
  const day = rows[0]?.observed_at.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  return ctx.runMutation(api.ingestion.importRows, {
    workspaceId,
    fileName: `${source}-${day}.json`,
    rows,
  });
}

export const syncCampus = action({
  args: { workspaceId: v.id("workspaces"), limit: v.optional(v.number()) },
  returns: syncResult,
  handler: async (ctx, { workspaceId, limit }) =>
    syncStore(ctx, workspaceId, "campus", limit),
});

export const syncAdditionalUcpStore = action({
  args: {
    workspaceId: v.id("workspaces"),
    store: v.union(
      v.literal("neemans"),
      v.literal("redtape"),
      v.literal("inc5"),
    ),
    limit: v.optional(v.number()),
  },
  returns: syncResult,
  handler: async (ctx, { workspaceId, store, limit }) =>
    syncStore(ctx, workspaceId, store, limit),
});

export const syncCaiStore = action({
  args: { workspaceId: v.id("workspaces"), limit: v.optional(v.number()) },
  returns: syncResult,
  handler: async (ctx, { workspaceId, limit }) =>
    syncStore(ctx, workspaceId, "cai", limit),
});
