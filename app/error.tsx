"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[70vh] place-items-center p-6">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          <AlertTriangle />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold">
          This view could not load
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {error.message || "The application received an unexpected response."}
        </p>
        <Button className="mt-5" onClick={reset}>
          <RotateCcw />
          Try again
        </Button>
        {error.digest && (
          <p className="mt-3 text-[10px] text-muted-foreground">
            Reference {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
