"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/lib/useWorkspace";
import { ExternalLink, Send, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DemoBadge,
  PageHeader,
  Score,
  StageBadge,
} from "@/components/MarketUI";

const suggestions = [
  "Which men’s casual shoes below ₹1,500 are accelerating?",
  "Are clogs growing organically or through discounting?",
  "Which products gained rank while maintaining price?",
  "What should I test based on my margin and lead time?",
];
export default function Research() {
  const { workspaceSlug, loading } = useWorkspace();
  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState("");
  const result = useQuery(
    api.research.answer,
    question && !loading ? { workspaceSlug, question } : "skip",
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    if (draft.trim()) setQuestion(draft.trim());
  }
  return (
    <>
      <PageHeader
        eyebrow="Structured research"
        title="Ask the market"
        description="Answers use named read-only tools and show evidence, dates, filters, assumptions, and confidence."
      >
        <DemoBadge />
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[.7fr_1.3fr]">
        <div className="data-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2f726b]" />
            <h2 className="font-display text-xl font-semibold">
              Suggested questions
            </h2>
          </div>
          <div className="mt-4 space-y-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setDraft(s);
                  setQuestion(s);
                }}
                className="w-full rounded-xl border p-3 text-left text-xs leading-5 transition-colors hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#2f726b]" />
            The assistant cannot run arbitrary SQL or invent trend claims.
          </div>
        </div>
        <div>
          <form onSubmit={submit} className="data-card p-4">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a category, product type, attribute, platform, price band, or trend stage…"
              className="min-h-28 resize-none border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-[10px] text-muted-foreground">
                India · All platforms · Latest 30 days
              </span>
              <Button type="submit" className="bg-[#173e3d] text-white">
                <Send />
                Research
              </Button>
            </div>
          </form>
          {question && result === undefined && (
            <div className="data-card mt-4 animate-pulse p-6">
              <div className="h-5 w-48 rounded bg-muted" />
              <div className="mt-4 h-20 rounded bg-muted" />
            </div>
          )}
          {result && (
            <div className="mt-4 space-y-4">
              <div className="data-card p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#2f726b]">
                    Answer
                  </span>
                  <span className="text-xs font-semibold">
                    {result.confidence}% confidence
                  </span>
                </div>
                <p className="mt-3 text-base leading-7">{result.answer}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {result.toolCalls.map((tool: string) => (
                    <span
                      key={tool}
                      className="rounded-md bg-muted px-2 py-1 text-[9px] font-semibold"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {result.evidence.map((item: any) => (
                  <div key={item.title} className="data-card p-4">
                    <div className="flex justify-between gap-2">
                      <StageBadge stage={item.stage} />
                      <Score size="sm" value={item.score} label="Trend" />
                    </div>
                    <h3 className="mt-3 font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {item.explanation}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-[10px] text-muted-foreground">
                      <span>
                        Observed{" "}
                        {new Date(item.observedAt).toLocaleDateString("en-IN")}
                      </span>
                      <a
                        href={item.sourceLinks[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#2f726b]"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="data-card p-4 text-xs">
                <p className="font-semibold">Assumptions</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.assumptions.map((a: string) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <p className="mt-3 font-semibold">Filters used</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-[10px]">
                  {JSON.stringify(result.filters, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
