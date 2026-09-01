import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";

type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Sign in with GitHub to continue.");
  return userId;
}

export async function workspaceBySlug(
  ctx: Ctx,
  slug: string,
): Promise<Doc<"workspaces">> {
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  if (!workspace) throw new Error("Workspace not found.");
  if (!workspace.demo) {
    const userId = await requireUserId(ctx);
    const membership = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_and_workspace", (q) =>
        q.eq("userId", userId).eq("workspaceId", workspace._id),
      )
      .unique();
    if (!membership)
      throw new Error("You do not have access to this workspace.");
  }
  return workspace;
}

export async function requireWorkspace(
  ctx: Ctx,
  workspaceId: Id<"workspaces">,
) {
  const workspace = await ctx.db.get("workspaces", workspaceId);
  if (!workspace) throw new Error("Workspace not found.");
  const userId = await requireUserId(ctx);
  const membership = await ctx.db
    .query("workspaceMembers")
    .withIndex("by_user_and_workspace", (q) =>
      q.eq("userId", userId).eq("workspaceId", workspaceId),
    )
    .unique();
  if (!membership) throw new Error("You do not have access to this workspace.");
  return { workspace, userId, membership };
}
