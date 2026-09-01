"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWorkspace } from "@/lib/useWorkspace";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DemoBadge,
  LoadingPage,
  PageHeader,
  Score,
  StageBadge,
} from "@/components/MarketUI";

export default function WeeklyReport() {
  const { workspaceSlug, loading } = useWorkspace();
  const report = useQuery(
    api.reports.weekly,
    loading ? "skip" : { workspaceSlug },
  );
  if (loading || !report) return <LoadingPage />;
  function csv() {
    if (!report) return;
    const rows = [
      "cluster,trend,stage,opportunity,saturation",
      ...report.rising.map(
        (r: any) =>
          `"${r.cluster.name}",${r.score?.score},${r.score?.stage},${r.opportunity?.score},${r.opportunity?.saturation}`,
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "solesignal-weekly-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeader
        eyebrow="Weekly research report"
        title={report.title}
        description={`${report.period} · generated from current workspace observations.`}
      >
        <DemoBadge />
        <Button
          size="sm"
          variant="outline"
          className="no-print"
          onClick={() => window.print()}
        >
          <Printer />
          Print
        </Button>
        <Button size="sm" variant="outline" className="no-print" onClick={csv}>
          <Download />
          CSV
        </Button>
      </PageHeader>
      <article className="mx-auto max-w-5xl space-y-5">
        <Section number="01" title="Executive summary">
          <p className="text-base leading-7">{report.executiveSummary}</p>
        </Section>
        <Section number="02" title="Five rising opportunities">
          <div className="grid gap-3 md:grid-cols-2">
            {report.rising.map((row: any) => (
              <div key={row.cluster._id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <StageBadge stage={row.score?.stage} />
                    <h3 className="mt-2 font-semibold">{row.cluster.name}</h3>
                  </div>
                  <Score
                    size="sm"
                    value={row.opportunity?.score}
                    label="Opp."
                    tone="lime"
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Trend {row.score?.score} · Saturation{" "}
                  {row.opportunity?.saturation} · Confidence{" "}
                  {row.score?.confidence}%
                </p>
              </div>
            ))}
          </div>
        </Section>
        <Section number="03" title="Declining or risky trends">
          <div className="space-y-2">
            {report.risks.map((row: any) => (
              <div
                key={row.cluster._id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div>
                  <p className="font-semibold">{row.cluster.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.score?.explanation}
                  </p>
                </div>
                <Score
                  size="sm"
                  value={row.opportunity?.saturation}
                  label="Supply"
                  tone="amber"
                />
              </div>
            ))}
          </div>
        </Section>
        <Section number="04" title="Price-band movement">
          <p className="text-sm leading-6 text-muted-foreground">
            Mass and mid-market comfort products show the strongest clean
            momentum. Premium court-inspired sneakers are emerging from a
            smaller base. Deep discounting remains concentrated in chunky
            sneakers and clogs.
          </p>
        </Section>
        <Section number="05" title="New competitor activity">
          <p className="text-sm leading-6 text-muted-foreground">
            The synthetic demo adds two new court-inspired listings and three
            clog listings. This represents supply-side adoption, not proof of
            demand.
          </p>
        </Section>
        <Section number="06" title="Attribute trends">
          <p className="text-sm leading-6 text-muted-foreground">
            Gum soles, low-profile suede, arch support, and clean court styling
            are strengthening. High-shine pointed formal constructions are
            weakening.
          </p>
        </Section>
        <Section number="07" title="Demand versus saturation">
          <p className="text-sm leading-6 text-muted-foreground">
            Comfort slippers have the cleanest whitespace. Clogs combine demand
            with 91/100 saturation, making them a trend to watch rather than a
            manufacturing priority.
          </p>
        </Section>
        <Section number="08" title="Recommendations">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
            <li>Sample a low-profile suede sneaker at ₹1,499–₹2,499.</li>
            <li>Test comfort slippers with arch support in mass pricing.</li>
            <li>Watch court-inspired leather sneakers before adding depth.</li>
            <li>Avoid undifferentiated EVA clogs despite visible demand.</li>
            <li>Reduce exposure to high-shine pointed formal oxfords.</li>
          </ol>
        </Section>
        <Section number="09" title="Evidence and confidence">
          <p className="text-sm leading-6 text-muted-foreground">
            Each item links to product observations, timestamps, source URLs,
            scoring version, and components in the trend explorer. Confidence
            ranges from 75% to 91% in this synthetic report.
          </p>
        </Section>
        <Section number="10" title="Coverage and limitations">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {report.limitations.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      </article>
    </>
  );
}
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="data-card p-5 sm:p-7">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="text-xs font-bold text-[#2f726b]">{number}</span>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
