import type {
  CollectorObservation,
  ConnectorStatus,
  SourceAdapter,
} from "../types";

export class FlipkartAffiliateAdapter implements SourceAdapter {
  readonly key = "flipkart-affiliate";
  async status(): Promise<ConnectorStatus> {
    if (
      !process.env.FLIPKART_AFFILIATE_ID ||
      !process.env.FLIPKART_AFFILIATE_TOKEN
    )
      return {
        key: this.key,
        state: "not_connected",
        message:
          "Set FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN to connect.",
      };
    if (!process.env.FLIPKART_AFFILIATE_API_URL)
      return {
        key: this.key,
        state: "review_required",
        message:
          "Credentials exist, but the current approved API base URL must be configured before requests are made.",
      };
    return {
      key: this.key,
      state: "healthy",
      message: "Credentials and approved API base URL are configured.",
    };
  }
  async discoverCategories() {
    const status = await this.status();
    if (status.state !== "healthy") return [];
    return [
      {
        name: "Configured affiliate feed",
        url: process.env.FLIPKART_AFFILIATE_API_URL!,
      },
    ];
  }
  async collect(): Promise<CollectorObservation[]> {
    const status = await this.status();
    if (status.state !== "healthy") throw new Error(status.message);
    throw new Error(
      "Flipkart response mapping must be fixture-verified against the operator's current affiliate contract before activation.",
    );
  }
}
