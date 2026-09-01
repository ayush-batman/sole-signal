import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId, requireWorkspace } from "./lib/access";

export const mine = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    return Promise.all(
      memberships.map(async (membership) => ({
        membership,
        workspace: await ctx.db.get("workspaces", membership.workspaceId),
      })),
    );
  },
});

export const createAndOnboard = mutation({
  args: {
    name: v.string(),
    businessType: v.string(),
    targetCustomer: v.string(),
    audiences: v.array(v.string()),
    categories: v.array(v.string()),
    competitors: v.array(v.string()),
    desiredGrossMargin: v.number(),
    normalMoq: v.number(),
    leadTimeDays: v.number(),
    riskTolerance: v.string(),
  },
  returns: v.id("workspaces"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const base =
      args.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "workspace";
    let slug = base;
    for (
      let suffix = 2;
      await ctx.db
        .query("workspaces")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      suffix += 1
    )
      slug = `${base}-${suffix}`;
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name.trim(),
      slug,
      country: "IN",
      currency: "INR",
      locale: "en-IN",
      timezone: "Asia/Kolkata",
      demo: false,
      createdAt: Date.now(),
    });
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });
    await ctx.db.insert("businessProfiles", {
      workspaceId,
      businessType: args.businessType,
      targetCustomer: args.targetCustomer,
      audiences: args.audiences,
      categories: args.categories,
      priceBands: [
        { name: "Value", min: 0, max: 799 },
        { name: "Mass", min: 800, max: 1499 },
        { name: "Mid", min: 1500, max: 2999 },
        { name: "Premium", min: 3000, max: 6999 },
        { name: "High premium", min: 7000 },
      ],
      markets: ["IN"],
      competitors: args.competitors,
      desiredGrossMargin: args.desiredGrossMargin,
      normalMoq: args.normalMoq,
      leadTimeDays: args.leadTimeDays,
      riskTolerance: args.riskTolerance,
      onboardingComplete: true,
      updatedAt: Date.now(),
    });
    await ctx.db.insert("scoringConfigs", {
      workspaceId,
      trendWeights: {
        rankMomentum: 25,
        rankStrength: 20,
        reviewVelocity: 15,
        availabilityPressure: 15,
        crossSourceBreadth: 10,
        searchMomentum: 10,
        priceResilience: 5,
      },
      saturationWeights: {
        listingGrowth: 40,
        brandCount: 25,
        deepDiscountShare: 20,
        density: 15,
      },
      opportunityWeights: {
        trend: 45,
        whitespace: 20,
        margin: 15,
        leadTime: 10,
        catalogue: 10,
      },
      minObservationCount: 3,
      minHistoryDays: 7,
      version: "v1",
      updatedAt: Date.now(),
    });
    return workspaceId;
  },
});

export const profile = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.any(),
  handler: async (ctx, { workspaceId }) => {
    await requireWorkspace(ctx, workspaceId);
    return ctx.db
      .query("businessProfiles")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .unique();
  },
});
