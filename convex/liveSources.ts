import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

const profileUrl = "https://opulent-starfish-202.convex.site/ucp-agent.json";
const campusEndpoint = "https://www.campusshoes.com/api/ucp/mcp";

type Money = { amount: number; currency: string };
type Variant = {
  availability?: { available?: boolean };
  options?: Array<{ name?: string; label?: string }>;
  media?: Array<{ type?: string; url?: string }>;
};
type Product = {
  id?: string;
  title?: string;
  url?: string;
  handle?: string;
  price_range?: { min?: Money; max?: Money };
  list_price_range?: { min?: Money; max?: Money };
  variants?: Variant[];
  media?: Array<{ type?: string; url?: string }>;
  tags?: string[];
};

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const item = value as Product;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.url === "string" &&
    typeof item.price_range?.min?.amount === "number" &&
    typeof item.price_range.min.currency === "string"
  );
}

function category(product: Product): string {
  const text =
    `${product.title} ${(product.tags ?? []).join(" ")}`.toLowerCase();
  for (const value of [
    "running shoes",
    "walking shoes",
    "sneakers",
    "sandals",
    "slippers",
    "clogs",
  ])
    if (text.includes(value)) return value;
  return "footwear";
}

export const syncCampus = action({
  args: { workspaceId: v.id("workspaces"), limit: v.optional(v.number()) },
  returns: v.object({
    inserted: v.number(),
    duplicates: v.number(),
    importRunId: v.id("importRuns"),
  }),
  handler: async (
    ctx,
    { workspaceId, limit },
  ): Promise<{
    inserted: number;
    duplicates: number;
    importRunId: Id<"importRuns">;
  }> => {
    if (!(await getAuthUserId(ctx)))
      throw new Error("Sign in with GitHub to sync live data.");
    const safeLimit = Math.max(1, Math.min(Math.floor(limit ?? 24), 100));
    const response = await fetch(campusEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "solesignal-convex-sync",
        method: "tools/call",
        params: {
          name: "search_catalog",
          arguments: {
            meta: { "ucp-agent": { profile: profileUrl } },
            catalog: {
              query: "shoes",
              context: {
                address_country: "IN",
                currency: "INR",
                language: "en-IN",
              },
              filters: { available: true },
              pagination: { limit: safeLimit },
            },
          },
        },
      }),
    });
    if (!response.ok)
      throw new Error(`Campus UCP returned HTTP ${response.status}.`);
    const payload = (await response.json()) as {
      result?: {
        isError?: boolean;
        structuredContent?: { products?: unknown[] };
      };
      error?: { message?: string };
    };
    if (payload.error || payload.result?.isError)
      throw new Error(
        payload.error?.message ?? "Campus UCP reported an error.",
      );
    const products = (payload.result?.structuredContent?.products ?? []).filter(
      isProduct,
    );
    if (!products.length)
      throw new Error("Campus UCP returned no valid products.");
    // One observation per product per UTC day keeps manual retries idempotent.
    const observedAt = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const rows = products.slice(0, safeLimit).map((product) => {
      const variants = product.variants ?? [];
      const available = variants.filter(
        (variant) => variant.availability?.available === true,
      );
      const sizes = [
        ...new Set(
          available.flatMap((variant) =>
            (variant.options ?? [])
              .filter((option) => option.name?.toLowerCase() === "size")
              .flatMap((option) => (option.label ? [option.label] : [])),
          ),
        ),
      ];
      const image =
        product.media?.find((item) => item.type === "image")?.url ??
        available
          .flatMap((variant) => variant.media ?? [])
          .find((item) => item.type === "image")?.url ??
        null;
      return {
        source: "campus-ucp",
        source_product_id: product.id!.split("/").at(-1)!,
        url: product.url!,
        title: product.title!,
        brand: "Campus",
        price: product.price_range!.min!.amount / 100,
        original_price: product.list_price_range?.max?.amount
          ? product.list_price_range.max.amount / 100
          : null,
        currency: product.price_range!.min!.currency,
        rating: null,
        review_count: null,
        rank: null,
        category: category(product),
        availability: available.length ? "in_stock" : "out_of_stock",
        sizes_available: sizes,
        image_url: image,
        observed_at: observedAt,
      };
    });
    return ctx.runMutation(api.ingestion.importRows, {
      workspaceId,
      fileName: `campus-ucp-${observedAt.slice(0, 10)}.json`,
      rows,
    });
  },
});

const additionalUcpStores = {
  neemans: {
    source: "neemans-ucp",
    name: "Neeman's",
    brand: "Neeman's",
    endpoint: "https://babymarketstore.myshopify.com/api/ucp/mcp",
  },
  redtape: {
    source: "redtape-ucp",
    name: "RedTape",
    brand: "RedTape",
    endpoint: "https://redtapein.myshopify.com/api/ucp/mcp",
  },
  inc5: {
    source: "inc5-ucp",
    name: "INC.5",
    brand: "INC.5",
    endpoint: "https://inc5shoesonline.myshopify.com/api/ucp/mcp",
  },
} as const;

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
  returns: v.object({
    inserted: v.number(),
    duplicates: v.number(),
    importRunId: v.id("importRuns"),
  }),
  handler: async (
    ctx,
    { workspaceId, store, limit },
  ): Promise<{
    inserted: number;
    duplicates: number;
    importRunId: Id<"importRuns">;
  }> => {
    if (!(await getAuthUserId(ctx)))
      throw new Error("Sign in with GitHub to sync live data.");
    const config = additionalUcpStores[store];
    const safeLimit = Math.max(1, Math.min(Math.floor(limit ?? 24), 100));
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `solesignal-${store}-sync`,
        method: "tools/call",
        params: {
          name: "search_catalog",
          arguments: {
            meta: { "ucp-agent": { profile: profileUrl } },
            catalog: {
              query: "shoes",
              context: {
                address_country: "IN",
                currency: "INR",
                language: "en-IN",
              },
              filters: { available: true },
              pagination: { limit: safeLimit },
            },
          },
        },
      }),
    });
    if (!response.ok)
      throw new Error(`${config.name} UCP returned HTTP ${response.status}.`);
    const payload = (await response.json()) as {
      result?: {
        isError?: boolean;
        structuredContent?: { products?: unknown[] };
      };
      error?: { message?: string };
    };
    if (payload.error || payload.result?.isError)
      throw new Error(
        payload.error?.message ?? `${config.name} UCP reported an error.`,
      );
    const products = (payload.result?.structuredContent?.products ?? []).filter(
      isProduct,
    );
    if (!products.length)
      throw new Error(`${config.name} UCP returned no valid products.`);
    const observedAt = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const rows = products.slice(0, safeLimit).map((product) => {
      const variants = product.variants ?? [];
      const available = variants.filter(
        (variant) => variant.availability?.available === true,
      );
      const sizes = [
        ...new Set(
          available.flatMap((variant) =>
            (variant.options ?? [])
              .filter((option) => option.name?.toLowerCase() === "size")
              .flatMap((option) => (option.label ? [option.label] : [])),
          ),
        ),
      ];
      const image =
        product.media?.find((item) => item.type === "image")?.url ??
        available
          .flatMap((variant) => variant.media ?? [])
          .find((item) => item.type === "image")?.url ??
        null;
      return {
        source: config.source,
        source_product_id: product.id!.split("/").at(-1)!,
        url: product.url!,
        title: product.title!,
        brand: config.brand,
        price: product.price_range!.min!.amount / 100,
        original_price: product.list_price_range?.max?.amount
          ? product.list_price_range.max.amount / 100
          : null,
        currency: product.price_range!.min!.currency,
        rating: null,
        review_count: null,
        rank: null,
        category: category(product),
        availability: available.length ? "in_stock" : "out_of_stock",
        sizes_available: sizes,
        image_url: image,
        observed_at: observedAt,
      };
    });
    return ctx.runMutation(api.ingestion.importRows, {
      workspaceId,
      fileName: `${config.source}-${observedAt.slice(0, 10)}.json`,
      rows,
    });
  },
});

type ShopifyProduct = {
  id?: number;
  title?: string;
  handle?: string;
  vendor?: string;
  product_type?: string;
  images?: Array<{ src?: string }>;
  variants?: Array<{
    price?: string;
    compare_at_price?: string | null;
    available?: boolean;
    title?: string;
  }>;
};

export const syncCaiStore = action({
  args: { workspaceId: v.id("workspaces"), limit: v.optional(v.number()) },
  returns: v.object({
    inserted: v.number(),
    duplicates: v.number(),
    importRunId: v.id("importRuns"),
  }),
  handler: async (
    ctx,
    { workspaceId, limit },
  ): Promise<{
    inserted: number;
    duplicates: number;
    importRunId: Id<"importRuns">;
  }> => {
    if (!(await getAuthUserId(ctx)))
      throw new Error("Sign in with GitHub to sync live data.");
    const safeLimit = Math.max(1, Math.min(Math.floor(limit ?? 24), 100));
    const response = await fetch(
      `https://thecaistore.com/collections/all/products.json?limit=${safeLimit}`,
      { headers: { accept: "application/json" } },
    );
    if (!response.ok)
      throw new Error(
        `The CAI Store catalog returned HTTP ${response.status}.`,
      );
    const payload = (await response.json()) as { products?: ShopifyProduct[] };
    const observedAt = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
    const rows = (payload.products ?? [])
      .filter(
        (product) =>
          typeof product.id === "number" &&
          typeof product.title === "string" &&
          typeof product.handle === "string" &&
          (product.variants?.length ?? 0) > 0,
      )
      .slice(0, safeLimit)
      .map((product) => {
        const variants = product.variants ?? [];
        const available = variants.filter((variant) => variant.available);
        const primary = available[0] ?? variants[0];
        return {
          source: "cai-store-public",
          source_product_id: String(product.id),
          url: `https://thecaistore.com/products/${product.handle}`,
          title: product.title!,
          brand: product.vendor || "The CAI Store",
          price: Number(primary?.price ?? 0),
          original_price: primary?.compare_at_price
            ? Number(primary.compare_at_price)
            : null,
          currency: "INR",
          rating: null,
          review_count: null,
          rank: null,
          category: product.product_type || "footwear",
          availability: available.length ? "in_stock" : "out_of_stock",
          sizes_available: available.flatMap((variant) =>
            variant.title ? [variant.title] : [],
          ),
          image_url: product.images?.[0]?.src ?? null,
          observed_at: observedAt,
        };
      });
    if (!rows.length)
      throw new Error("The CAI Store returned no valid products.");
    return ctx.runMutation(api.ingestion.importRows, {
      workspaceId,
      fileName: `cai-store-public-${observedAt.slice(0, 10)}.json`,
      rows,
    });
  },
});
