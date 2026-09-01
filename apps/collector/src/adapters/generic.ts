import { CheerioCrawler } from "crawlee";
import {
  retailerConfigSchema,
  type CollectorObservation,
  type ConnectorStatus,
  type RetailerConfig,
  type SourceAdapter,
} from "../types";
import { assertRobotsAllowed, requestHeaders } from "../compliance";

const numberFrom = (text: string) => {
  const value = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : null;
};
export class ConfigurableRetailerAdapter implements SourceAdapter {
  readonly key: string;
  private readonly config: RetailerConfig;
  constructor(input: RetailerConfig) {
    this.config = retailerConfigSchema.parse(input);
    this.key = this.config.key;
  }
  async status(): Promise<ConnectorStatus> {
    try {
      await Promise.all(this.config.categoryUrls.map(assertRobotsAllowed));
      return {
        key: this.key,
        state: "review_required",
        message:
          "Robots permits configured URLs; site-specific terms and fixture approval are still required.",
      };
    } catch (error) {
      return {
        key: this.key,
        state: "blocked",
        message:
          error instanceof Error ? error.message : "Robots check failed.",
      };
    }
  }
  async discoverCategories() {
    return this.config.categoryUrls.map((url, index) => ({
      name: `Configured category ${index + 1}`,
      url,
    }));
  }
  async collect(limit = 50): Promise<CollectorObservation[]> {
    for (const url of this.config.categoryUrls) await assertRobotsAllowed(url);
    const observations: CollectorObservation[] = [];
    const config = this.config;
    const key = this.key;
    const crawler = new CheerioCrawler({
      maxRequestsPerMinute: config.allowedRequestsPerMinute,
      maxRequestRetries: 2,
      requestHandlerTimeoutSecs: 30,
      preNavigationHooks: [
        async (_ctx, options) => {
          options.headers = { ...options.headers, ...requestHeaders() };
        },
      ],
      async requestHandler({ $, request }) {
        $(config.selectors.product).each((index, element) => {
          if (observations.length >= limit) return;
          const node = $(element);
          const href = node.find(config.selectors.url).attr("href") ?? "";
          const url = new URL(href, request.loadedUrl).toString();
          const title = node.find(config.selectors.title).text().trim();
          const price = numberFrom(node.find(config.selectors.price).text());
          if (!title || price == null) return;
          observations.push({
            source: key,
            source_product_id: node.attr("data-product-id") ?? url,
            title,
            url,
            brand: config.selectors.brand
              ? node.find(config.selectors.brand).text().trim()
              : "Unknown",
            price,
            original_price: config.selectors.originalPrice
              ? numberFrom(node.find(config.selectors.originalPrice).text())
              : null,
            currency: config.currency,
            rating: null,
            review_count: null,
            rank: index + 1,
            category: (request.userData.categoryName as string) ?? "footwear",
            availability: "unknown",
            sizes_available: [],
            image_url: config.selectors.image
              ? (node.find(config.selectors.image).attr("src") ?? null)
              : null,
            observed_at: new Date().toISOString(),
            raw: { adapter: "generic", configKey: key },
          });
        });
      },
    });
    await crawler.run(
      config.categoryUrls.map((url, index) => ({
        url,
        userData: { categoryName: `Configured category ${index + 1}` },
      })),
    );
    return observations;
  }
}
