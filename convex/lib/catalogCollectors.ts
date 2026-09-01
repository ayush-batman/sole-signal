import { inferAttributes } from "../../packages/domain/src";

export type CatalogRow = {
  source: string;
  source_product_id: string;
  url: string;
  title: string;
  brand: string;
  price: number;
  original_price: number | null;
  currency: string;
  rating: number | null;
  review_count: number | null;
  rank: number | null;
  rank_type?:
    | "bestseller"
    | "marketplace_popularity"
    | "search_position"
    | "catalog_position";
  rank_context?: string;
  category: string;
  availability: string;
  sizes_available: string[];
  image_url: string | null;
  observed_at: string;
};

type Money = { amount: number; currency: string };
type Variant = {
  availability?: { available?: boolean };
  options?: Array<{ name?: string; label?: string }>;
  media?: Array<{ type?: string; url?: string }>;
};
type UcpProduct = {
  id?: string;
  title?: string;
  url?: string;
  price_range?: { min?: Money; max?: Money };
  list_price_range?: { min?: Money; max?: Money };
  variants?: Variant[];
  media?: Array<{ type?: string; url?: string }>;
  tags?: string[];
};

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

export const catalogStores = {
  campus: {
    kind: "ucp",
    source: "campus-ucp",
    name: "Campus Shoes",
    brand: "Campus",
    endpoint: "https://www.campusshoes.com/api/ucp/mcp",
  },
  neemans: {
    kind: "ucp",
    source: "neemans-ucp",
    name: "Neeman's",
    brand: "Neeman's",
    endpoint: "https://babymarketstore.myshopify.com/api/ucp/mcp",
  },
  redtape: {
    kind: "ucp",
    source: "redtape-ucp",
    name: "RedTape",
    brand: "RedTape",
    endpoint: "https://redtapein.myshopify.com/api/ucp/mcp",
  },
  inc5: {
    kind: "ucp",
    source: "inc5-ucp",
    name: "INC.5",
    brand: "INC.5",
    endpoint: "https://inc5shoesonline.myshopify.com/api/ucp/mcp",
  },
  cai: {
    kind: "shopify",
    source: "cai-store-public",
    name: "The CAI Store",
    brand: "The CAI Store",
    endpoint: "https://thecaistore.com/collections/all/products.json",
  },
} as const;

export type CatalogStoreKey = keyof typeof catalogStores;

function observedDay(): string {
  return `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
}

function categoryFor(product: UcpProduct): string {
  return inferAttributes(
    product.title ?? "footwear",
    (product.tags ?? []).join(" "),
  ).primaryCategory;
}

function validUcpProduct(product: UcpProduct): boolean {
  return (
    typeof product.id === "string" &&
    typeof product.title === "string" &&
    typeof product.url === "string" &&
    typeof product.price_range?.min?.amount === "number" &&
    typeof product.price_range.min.currency === "string"
  );
}

async function searchUcp(
  config: (typeof catalogStores)["campus"],
  query: string,
  limit: number,
): Promise<UcpProduct[]> {
  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl) throw new Error("CONVEX_SITE_URL is unavailable.");
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `solesignal-${config.source}-${query.replaceAll(" ", "-")}`,
      method: "tools/call",
      params: {
        name: "search_catalog",
        arguments: {
          meta: { "ucp-agent": { profile: `${siteUrl}/ucp-agent.json` } },
          catalog: {
            query,
            context: {
              address_country: "IN",
              currency: "INR",
              language: "en-IN",
            },
            filters: { available: true },
            pagination: { limit },
          },
        },
      },
    }),
  });
  if (!response.ok)
    throw new Error(`${config.name} returned HTTP ${response.status}.`);
  const payload = (await response.json()) as {
    result?: {
      isError?: boolean;
      structuredContent?: { products?: UcpProduct[] };
    };
    error?: { message?: string };
  };
  if (payload.error || payload.result?.isError) {
    throw new Error(
      payload.error?.message ?? `${config.name} reported an error.`,
    );
  }
  return (payload.result?.structuredContent?.products ?? []).filter(
    validUcpProduct,
  );
}

async function collectUcp(
  config: (typeof catalogStores)["campus"],
  limit: number,
): Promise<CatalogRow[]> {
  const formalLimit = Math.max(1, Math.ceil(limit * 0.75));
  const [formalProducts, broadProducts] = await Promise.all([
    searchUcp(config, "formal shoes", formalLimit),
    searchUcp(config, "shoes", limit),
  ]);
  const products = [
    ...new Map(
      [...formalProducts, ...broadProducts].map((product) => [
        product.id!,
        product,
      ]),
    ).values(),
  ].slice(0, limit);
  if (!products.length)
    throw new Error(`${config.name} returned no valid products.`);
  return products.map((product) => {
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
      category: categoryFor(product),
      availability: available.length ? "in_stock" : "out_of_stock",
      sizes_available: sizes,
      image_url: image,
      observed_at: observedDay(),
    };
  });
}

async function collectShopify(
  config: (typeof catalogStores)["cai"],
  limit: number,
): Promise<CatalogRow[]> {
  const response = await fetch(`${config.endpoint}?limit=${limit}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`${config.name} returned HTTP ${response.status}.`);
  const payload = (await response.json()) as { products?: ShopifyProduct[] };
  const rows = (payload.products ?? [])
    .filter(
      (product) =>
        typeof product.id === "number" &&
        typeof product.title === "string" &&
        typeof product.handle === "string" &&
        (product.variants?.length ?? 0) > 0,
    )
    .slice(0, limit)
    .map((product) => {
      const variants = product.variants ?? [];
      const available = variants.filter((variant) => variant.available);
      const primary = available[0] ?? variants[0];
      return {
        source: config.source,
        source_product_id: String(product.id),
        url: `https://thecaistore.com/products/${product.handle}`,
        title: product.title!,
        brand: product.vendor || config.brand,
        price: Number(primary?.price ?? 0),
        original_price: primary?.compare_at_price
          ? Number(primary.compare_at_price)
          : null,
        currency: "INR",
        rating: null,
        review_count: null,
        rank: null,
        category: inferAttributes(
          product.title!,
          product.product_type || "footwear",
        ).primaryCategory,
        availability: available.length ? "in_stock" : "out_of_stock",
        sizes_available: available.flatMap((variant) =>
          variant.title ? [variant.title] : [],
        ),
        image_url: product.images?.[0]?.src ?? null,
        observed_at: observedDay(),
      } satisfies CatalogRow;
    });
  if (!rows.length)
    throw new Error(`${config.name} returned no valid products.`);
  return rows;
}

export async function collectCatalog(
  store: CatalogStoreKey,
  requestedLimit = 100,
) {
  const limit = Math.max(1, Math.min(Math.floor(requestedLimit), 100));
  const config = catalogStores[store];
  return config.kind === "ucp"
    ? collectUcp(config as (typeof catalogStores)["campus"], limit)
    : collectShopify(config as (typeof catalogStores)["cai"], limit);
}
