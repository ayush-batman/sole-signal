import { Actor } from "apify";
import { CaiStoreAdapter } from "./adapters/caiStore";
import { CampusUcpAdapter } from "./adapters/campusUcp";
import { FlipkartAffiliateAdapter } from "./adapters/flipkart";

const adapters = {
  "cai-store-public": new CaiStoreAdapter(),
  "campus-ucp": new CampusUcpAdapter(),
  "flipkart-affiliate": new FlipkartAffiliateAdapter(),
};

await Actor.init();
try {
  const input =
    (await Actor.getInput<{
      source?: keyof typeof adapters;
      limit?: number;
    }>()) ?? {};
  const source =
    input.source ??
    (process.argv.includes("--source")
      ? (process.argv[
          process.argv.indexOf("--source") + 1
        ] as keyof typeof adapters)
      : "cai-store-public");
  const adapter = adapters[source];
  if (!adapter) throw new Error(`Unknown source: ${source}`);
  const status = await adapter.status();
  console.log(JSON.stringify({ event: "source_status", ...status }));
  if (status.state !== "healthy") {
    console.log(
      JSON.stringify({ event: "collection_skipped", reason: status.message }),
    );
  } else {
    const categories = await adapter.discoverCategories();
    console.log(
      JSON.stringify({
        event: "categories_discovered",
        count: categories.length,
        categories,
      }),
    );
    const observations = await adapter.collect(input.limit ?? 5);
    for (const observation of observations) await Actor.pushData(observation);
    console.log(
      JSON.stringify({
        event: "collection_complete",
        source,
        count: observations.length,
        observedAt: observations[0]?.observed_at ?? null,
      }),
    );
  }
} finally {
  await Actor.exit();
}
