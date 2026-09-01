import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/ucp-agent.json",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        ucp: {
          version: "2026-08-25",
          services: {},
          capabilities: {
            "dev.ucp.shopping.catalog.search": [
              {
                version: "2026-08-25",
                spec: "https://ucp.dev/2026-08-25/specification/catalog",
                schema:
                  "https://ucp.dev/2026-08-25/schemas/shopping/catalog_search.json",
              },
            ],
            "dev.ucp.shopping.catalog.lookup": [
              {
                version: "2026-08-25",
                spec: "https://ucp.dev/2026-08-25/specification/catalog",
                schema:
                  "https://ucp.dev/2026-08-25/schemas/shopping/catalog_lookup.json",
              },
            ],
          },
          payment_handlers: {},
        },
      }),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  }),
});

export default http;
