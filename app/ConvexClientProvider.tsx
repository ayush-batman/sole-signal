"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud",
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </ConvexAuthNextjsProvider>
  );
}
