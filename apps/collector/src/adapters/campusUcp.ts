import { z } from "zod";
import { requestHeaders } from "../compliance";
import type {
  CollectorObservation,
  ConnectorStatus,
  SourceAdapter,
} from "../types";

const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string(),
});
const mediaSchema = z.object({ type: z.string(), url: z.url() });
const optionSchema = z.object({ name: z.string(), label: z.string() });
const variantSchema = z.object({
  id: z.string(),
  sku: z.string().optional(),
  title: z.string(),
  price: moneySchema,
  list_price: moneySchema.optional(),
  availability: z.object({ available: z.boolean() }),
  options: z.array(optionSchema).default([]),
  media: z.array(mediaSchema).default([]),
});
const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url(),
  handle: z.string().optional(),
  price_range: z.object({ min: moneySchema, max: moneySchema }),
  list_price_range: z.object({ min: moneySchema, max: moneySchema }).optional(),
  variants: z.array(variantSchema).default([]),
  media: z.array(mediaSchema).default([]),
  tags: z.array(z.string()).default([]),
});
const searchResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  result: z.object({
    isError: z.boolean(),
    structuredContent: z.object({
      products: z.array(productSchema),
      pagination: z
        .object({ has_next_page: z.boolean(), cursor: z.string().optional() })
        .optional(),
    }),
  }),
});

type CampusProduct = z.infer<typeof productSchema>;

const origin = "https://www.campusshoes.com";
const endpoint = `${origin}/api/ucp/mcp`;
const defaultAgentProfile =
  "https://opulent-starfish-202.convex.site/ucp-agent.json";

function productCategory(product: CampusProduct): string {
  const text = `${product.title} ${product.tags.join(" ")}`.toLowerCase();
  for (const category of [
    "running shoes",
    "walking shoes",
    "sneakers",
    "sandals",
    "slippers",
    "clogs",
  ]) {
    if (text.includes(category)) return category;
  }
  return "footwear";
}

function availableSizes(product: CampusProduct): string[] {
  return [
    ...new Set(
      product.variants
        .filter((variant) => variant.availability.available)
        .flatMap((variant) =>
          variant.options
            .filter((option) => option.name.toLowerCase() === "size")
            .map((option) => option.label),
        ),
    ),
  ];
}

export function normaliseCampusProduct(
  product: CampusProduct,
  observedAt: string,
): CollectorObservation {
  const available = product.variants.filter(
    (variant) => variant.availability.available,
  );
  const image = product.media.find((item) => item.type === "image")?.url;
  const productId = product.id.split("/").at(-1) ?? product.id;
  return {
    source: "campus-ucp",
    source_product_id: productId,
    url: product.url,
    title: product.title,
    brand: "Campus",
    price: product.price_range.min.amount / 100,
    original_price: product.list_price_range
      ? product.list_price_range.max.amount / 100
      : null,
    currency: product.price_range.min.currency,
    rating: null,
    review_count: null,
    // UCP search order is relevance, not a sales or bestseller rank.
    rank: null,
    category: productCategory(product),
    availability: available.length ? "in_stock" : "out_of_stock",
    sizes_available: availableSizes(product),
    image_url: image ?? available[0]?.media[0]?.url ?? null,
    observed_at: observedAt,
    raw: {
      protocol: "UCP",
      protocolVersion: "2026-08-25",
      handle: product.handle,
      tags: product.tags,
      variantCount: product.variants.length,
      availableVariantCount: available.length,
      rankMeaning: "search_relevance_not_demand_rank",
    },
  };
}

export class CampusUcpAdapter implements SourceAdapter {
  readonly key = "campus-ucp";
  private readonly profile =
    process.env.SOLESIGNAL_UCP_PROFILE_URL ?? defaultAgentProfile;

  async status(): Promise<ConnectorStatus> {
    try {
      const [robots, agents, discovery, profile] = await Promise.all([
        fetch(`${origin}/robots.txt`, { headers: requestHeaders() }),
        fetch(`${origin}/agents.md`, { headers: requestHeaders() }),
        fetch(`${origin}/.well-known/ucp`, { headers: requestHeaders() }),
        fetch(this.profile, { headers: requestHeaders() }),
      ]);
      const [agentText, discoveryJson] = await Promise.all([
        agents.text(),
        discovery.json() as Promise<unknown>,
      ]);
      const permissionIsExplicit =
        agentText.includes("Read-Only Browsing (No Authentication Required)") &&
        agentText.includes("search_catalog");
      const endpointIsPublished =
        JSON.stringify(discoveryJson).includes("/api/ucp/mcp");
      return robots.ok &&
        agents.ok &&
        discovery.ok &&
        profile.ok &&
        permissionIsExplicit &&
        endpointIsPublished
        ? {
            key: this.key,
            state: "healthy",
            message:
              "Campus explicitly permits read-only catalog access and its UCP endpoint and agent profile are reachable.",
          }
        : {
            key: this.key,
            state: "review_required",
            message:
              "Campus permission, UCP discovery, or agent profile check changed.",
          };
    } catch (error) {
      return {
        key: this.key,
        state: "blocked",
        message: error instanceof Error ? error.message : "UCP check failed.",
      };
    }
  }

  async discoverCategories() {
    return [
      {
        name: "Running shoes",
        url: `${origin}/search?q=running+shoes&type=product`,
      },
      {
        name: "Walking shoes",
        url: `${origin}/search?q=walking+shoes&type=product`,
      },
      { name: "Sneakers", url: `${origin}/search?q=sneakers&type=product` },
      { name: "Sandals", url: `${origin}/search?q=sandals&type=product` },
      { name: "Slippers", url: `${origin}/search?q=slippers&type=product` },
    ];
  }

  async collect(limit = 24): Promise<CollectorObservation[]> {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { ...requestHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "solesignal-catalog-search",
        method: "tools/call",
        params: {
          name: "search_catalog",
          arguments: {
            meta: { "ucp-agent": { profile: this.profile } },
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
      throw new Error(`Campus UCP returned HTTP ${response.status}`);
    const parsed = searchResponseSchema.safeParse(await response.json());
    if (!parsed.success)
      throw new Error(`Campus UCP response changed: ${parsed.error.message}`);
    if (parsed.data.result.isError)
      throw new Error("Campus UCP reported an error.");
    const observedAt = new Date().toISOString();
    return parsed.data.result.structuredContent.products
      .slice(0, safeLimit)
      .map((product) => normaliseCampusProduct(product, observedAt));
  }
}
