import type { CatalogRow } from "./catalogCollectors";

export const marketplaceStores = {
  amazonIndia: {
    source: "amazon-india-anysite",
    name: "Amazon India",
    endpoint: "/api/amazon/products/search",
    rankType: "search_position" as const,
    rankContext: "Organic search position for “formal shoes”; not a sales rank",
  },
  flipkart: {
    source: "flipkart-anysite",
    name: "Flipkart",
    endpoint: "/api/flipkart/products/search",
    rankType: "search_position" as const,
    rankContext: "Search position for “formal shoes”; not a sales rank",
  },
  myntra: {
    source: "myntra-anysite",
    name: "Myntra",
    endpoint: "/api/myntra/products/search",
    rankType: "marketplace_popularity" as const,
    rankContext: "Myntra popularity-sort position for “formal shoes”; estimated demand signal",
  },
} as const;

export type MarketplaceStoreKey = keyof typeof marketplaceStores;

type MarketplaceProduct = {
  id?: string | number;
  title?: string | null;
  name?: string | null;
  alias?: string | null;
  brand?: string | null;
  url?: string | null;
  price?: number | null;
  list_price?: number | null;
  currency?: string | null;
  rating?: number | null;
  review_count?: number | null;
  rating_count?: number | null;
  image?: string | null;
  category?: string | null;
  article_type?: string | null;
  sub_category?: string | null;
  sizes?: string[];
  is_in_stock?: boolean | null;
  is_sponsored?: boolean;
};

function requestBody(store: MarketplaceStoreKey, count: number) {
  if (store === "amazonIndia") {
    return { domain: "amazon.in", query: "formal shoes", count };
  }
  if (store === "flipkart") {
    return { keyword: "formal shoes", count };
  }
  return { query: "formal shoes", count, sort: "popularity" };
}

function titleFor(product: MarketplaceProduct): string | null {
  return product.title ?? product.name ?? product.alias ?? null;
}

function brandFor(product: MarketplaceProduct, title: string): string {
  return product.brand?.trim() || title.split(/\s+/)[0] || "Unknown";
}

export function marketplaceCollectionEnabled(): boolean {
  return Boolean(process.env.ANYSITE_API_TOKEN);
}

export async function collectMarketplace(
  store: MarketplaceStoreKey,
  limit = 50,
): Promise<CatalogRow[]> {
  const token = process.env.ANYSITE_API_TOKEN;
  if (!token) {
    throw new Error("ANYSITE_API_TOKEN is unavailable.");
  }
  const config = marketplaceStores[store];
  const count = Math.max(1, Math.min(limit, store === "amazonIndia" ? 100 : 250));
  const response = await fetch(`https://api.anysite.io${config.endpoint}`, {
    method: "POST",
    headers: {
      "access-token": token,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(requestBody(store, count)),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(
      `${config.name} provider returned HTTP ${response.status}${detail ? `: ${detail}` : "."}`,
    );
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error(`${config.name} provider returned an invalid response.`);
  }
  const observedAt = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const products = (payload as MarketplaceProduct[]).filter(
    (product) =>
      product &&
      product.id != null &&
      Boolean(titleFor(product)) &&
      typeof product.url === "string" &&
      typeof product.price === "number" &&
      product.price >= 0 &&
      product.is_sponsored !== true,
  );
  if (!products.length) {
    throw new Error(`${config.name} provider returned no valid organic products.`);
  }
  return products.slice(0, limit).map((product, index) => {
    const title = titleFor(product)!;
    return {
      source: config.source,
      source_product_id: String(product.id),
      url: product.url!,
      title,
      brand: brandFor(product, title),
      price: product.price!,
      original_price: product.list_price ?? null,
      currency: product.currency ?? "INR",
      rating: product.rating ?? null,
      review_count: product.review_count ?? product.rating_count ?? null,
      rank: index + 1,
      rank_type: config.rankType,
      rank_context: config.rankContext,
      category:
        product.category ?? product.article_type ?? product.sub_category ?? "formal shoes",
      availability:
        product.is_in_stock === false
          ? "out_of_stock"
          : product.is_in_stock === true || (product.sizes?.length ?? 0) > 0
            ? "in_stock"
            : "unknown",
      sizes_available: product.sizes ?? [],
      image_url: product.image ?? null,
      observed_at: observedAt,
    };
  });
}
