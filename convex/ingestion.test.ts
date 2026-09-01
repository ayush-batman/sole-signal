/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const observation = {
  source: "partner-feed",
  source_product_id: "sku-101",
  url: "https://example.com/products/sku-101",
  title: "Low Profile Retro Suede Sneaker",
  brand: "Example",
  price: 1499,
  original_price: 1999,
  currency: "INR",
  rating: 4.4,
  review_count: 21,
  rank: 8,
  category: "casual",
  availability: "in_stock",
  sizes_available: ["7", "8", "9"],
  image_url: null,
  observed_at: "2026-08-31T09:00:00+05:30",
};

async function setup() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      name: "GitHub Test User",
      email: "owner@example.com",
    });
    const ownedWorkspaceId = await ctx.db.insert("workspaces", {
      name: "Owned workspace",
      slug: "owned",
      country: "IN",
      currency: "INR",
      locale: "en-IN",
      timezone: "Asia/Kolkata",
      demo: false,
      createdAt: 1,
    });
    const otherWorkspaceId = await ctx.db.insert("workspaces", {
      name: "Other workspace",
      slug: "other",
      country: "IN",
      currency: "INR",
      locale: "en-IN",
      timezone: "Asia/Kolkata",
      demo: false,
      createdAt: 1,
    });
    await ctx.db.insert("workspaceMembers", {
      workspaceId: ownedWorkspaceId,
      userId,
      role: "owner",
      joinedAt: 1,
    });
    return { userId, ownedWorkspaceId, otherWorkspaceId };
  });
  const signedIn = t.withIdentity({
    subject: `${ids.userId}|test-session`,
    name: "GitHub Test User",
    email: "owner@example.com",
  });
  return { t, signedIn, ...ids };
}

describe("CSV ingestion", () => {
  it("is idempotent and keeps snapshots inside the selected workspace", async () => {
    const { t, signedIn, ownedWorkspaceId, otherWorkspaceId } = await setup();

    const first = await signedIn.mutation(api.ingestion.importRows, {
      workspaceId: ownedWorkspaceId,
      fileName: "observations.csv",
      rows: [observation],
    });
    const second = await signedIn.mutation(api.ingestion.importRows, {
      workspaceId: ownedWorkspaceId,
      fileName: "observations.csv",
      rows: [observation],
    });

    expect(first).toMatchObject({ inserted: 1, duplicates: 0 });
    expect(second).toMatchObject({ inserted: 0, duplicates: 1 });
    const counts = await t.run(async (ctx) => ({
      owned: (
        await ctx.db
          .query("listingSnapshots")
          .withIndex("by_workspace_and_observed_at", (q) =>
            q.eq("workspaceId", ownedWorkspaceId),
          )
          .collect()
      ).length,
      other: (
        await ctx.db
          .query("listingSnapshots")
          .withIndex("by_workspace_and_observed_at", (q) =>
            q.eq("workspaceId", otherWorkspaceId),
          )
          .collect()
      ).length,
    }));
    expect(counts).toEqual({ owned: 1, other: 0 });
  });

  it("rejects imports into a workspace the user does not belong to", async () => {
    const { signedIn, otherWorkspaceId } = await setup();
    await expect(
      signedIn.mutation(api.ingestion.importRows, {
        workspaceId: otherWorkspaceId,
        fileName: "observations.csv",
        rows: [observation],
      }),
    ).rejects.toThrow("You do not have access to this workspace.");
  });
});
