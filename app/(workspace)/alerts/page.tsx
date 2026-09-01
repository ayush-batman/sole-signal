import { BellRing, CheckCircle2, CircleDot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge, PageHeader } from "@/components/MarketUI";

const rules = [
  ["Rank movement", "Move ≥ 10 positions in 7 days", "All casual footwear"],
  [
    "Opportunity threshold",
    "Opportunity Score ≥ 75",
    "Mass and mid price bands",
  ],
  ["Size stock-out", "2+ core sizes unavailable", "Comfort products"],
  ["Trend-stage change", "Any stage change", "Saved categories"],
];
export default function Alerts() {
  return (
    <>
      <PageHeader
        eyebrow="Signal monitoring"
        title="Alerts"
        description="Rules fire from stored observations and always retain the evidence that triggered them."
      >
        <DemoBadge />
        <Button
          size="sm"
          className="bg-[#173e3d] text-white"
          disabled
          title="Demo alert rules are read-only"
        >
          <Plus />
          New rule
        </Button>
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <div className="data-card p-5">
          <h2 className="font-display text-xl font-semibold">Active rules</h2>
          <div className="mt-4 divide-y">
            {rules.map(([name, condition, scope]) => (
              <div key={name} className="flex items-start gap-3 py-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {condition} · {scope}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="data-card p-5">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-amber-600" />
            <h2 className="font-display text-xl font-semibold">
              Recent events
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            <Event
              severity="high"
              title="Clog saturation crossed 90"
              detail="Saturated clogs · 31 Aug 2026 · 2 evidence observations"
            />
            <Event
              severity="medium"
              title="Comfort slipper core sizes narrowed"
              detail="Sizes 8 and 9 unavailable on one demo source"
            />
            <Event
              severity="low"
              title="Formal oxfords entered declining stage"
              detail="Trend Score fell to 31 with 84% confidence"
            />
          </div>
        </div>
      </div>
    </>
  );
}
function Event({
  severity,
  title,
  detail,
}: {
  severity: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <CircleDot
          className={`mt-0.5 h-4 w-4 ${severity === "high" ? "text-rose-600" : severity === "medium" ? "text-amber-600" : "text-cyan-600"}`}
        />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#2f726b]">
            <CheckCircle2 className="h-3 w-3" />
            Demo event · read-only
          </span>
        </div>
      </div>
    </div>
  );
}
