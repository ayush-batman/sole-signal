"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useWorkspace() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const memberships = useQuery(
    api.workspaces.mine,
    isAuthenticated ? {} : "skip",
  );
  const workspace = memberships?.find(
    (item: { workspace?: { name: string; slug: string } | null }) =>
      item.workspace,
  )?.workspace;
  return {
    workspace: workspace ?? null,
    workspaceSlug: workspace?.slug ?? "demo-india",
    usingDemo: !workspace,
    loading: isLoading || (isAuthenticated && memberships === undefined),
  };
}
