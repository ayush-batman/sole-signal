import type {
  CollectorObservation,
  ConnectorStatus,
  SourceAdapter,
} from "../types";

type Store = "amazon-india" | "flipkart" | "myntra";
type Product = {
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

const configs = {
  "amazon-india": {
    endpoint: "/api/amazon/products/search",
    body: (count: number) => ({ domain: "amazon.in", query: "formal shoes", count }),
    rankType: "search_position" as const,
    context: "Organic search position for “formal shoes”; not a sales rank",
  },
  flipkart: {
    endpoint: "/api/flipkart/products/search",
    body: (count: number) => ({ keyword: "formal shoes", count }),
    rankType: "search_position" as const,
    context: "Search position for “formal shoes”; not a sales rank",
  },
  myntra: {
    endpoint: "/api/myntra/products/search",
    body: (count: number) => ({ query: "formal shoes", count, sort: "popularity" }),
    rankType: "marketplace_popularity" as const,
    context: "Myntra popularity-sort position; estimated demand signal",
  },
};

export class AnysiteMarketplaceAdapter implements SourceAdapter {
  readonly key: string;
  constructor(private readonly store: Store) {
    this.key = `${store}-anysite`;
  }

  async status(): Promise<ConnectorStatus> {
    return process.env.ANYSITE_API_TOKEN
      ? {
          key: this.key,
          state: "healthy",
          message: "Marketplace provider token is configured.",
        }
      : {
          key: this.key,
          state: "not_connected",
          message: "Add ANYSITE_API_TOKEN to enable this marketplace feed.",
        };
  }

  async discoverCategories() {
    return [{ name: "Formal shoes", url: `provider://${this.store}/formal-shoes` }];
  }

  async collect(limit = 50): Promise<CollectorObservation[]> {
    const token = process.env.ANYSITE_API_TOKEN;
    if (!token) throw new Error("ANYSITE_API_TOKEN is unavailable.");
    const config = configs[this.store];
    const count = Math.max(1, Math.min(limit, 250));
    const response = await fetch(`https://api.anysite.io${config.endpoint}`, {
      method: "POST",
      headers: {
        "access-token": token,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(config.body(count)),
    });
    if (!response.ok)
      throw new Error(`${this.store} provider returned HTTP ${response.status}.`);
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) throw new Error("Provider returned invalid JSON.");
    const observedAt = new Date().toISOString();
    return (payload as Product[])
      .filter((p) => {
        const title = p.title ?? p.name ?? p.alias;
        return (
          p.id != null &&
          Boolean(title) &&
          typeof p.url === "string" &&
          typeof p.price === "number" &&
          p.is_sponsored !== true
        );
      })
      .slice(0, limit)
      .map((p, index) => {
        const title = p.title ?? p.name ?? p.alias!;
        return {
          source: this.key,
          source_product_id: String(p.id),
          url: p.url!,
          title,
          brand: p.brand?.trim() || title.split(/\s+/)[0] || "Unknown",
          price: p.price!,
          original_price: p.list_price ?? null,
          currency: p.currency ?? "INR",
          rating: p.rating ?? null,
          review_count: p.review_count ?? p.rating_count ?? null,
          rank: index + 1,
          rank_type: config.rankType,
          rank_context: config.context,
          category: p.category ?? p.article_type ?? p.sub_category ?? "formal shoes",
          availability:
            p.is_in_stock === false
              ? "out_of_stock"
              : p.is_in_stock === true || (p.sizes?.length ?? 0) > 0
                ? "in_stock"
                : "unknown",
          sizes_available: p.sizes ?? [],
          image_url: p.image ?? null,
          observed_at: observedAt,
          raw: { provider: "anysite", store: this.store },
        };
      });
  }
}
