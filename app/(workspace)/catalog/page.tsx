"use client";

import { ChangeEvent, useState } from "react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  csvTemplate,
  parseObservationCsv,
  type CsvParseResult,
} from "@/packages/domain/src";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Github,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { DemoBadge, PageHeader } from "@/components/MarketUI";

export default function Catalog() {
  const { isAuthenticated } = useConvexAuth();
  return (
    <>
      <PageHeader
        eyebrow="First-party context"
        title="Catalog and CSV import"
        description="Validate product observations in the browser, then append them idempotently to your private workspace."
      >
        <DemoBadge />
      </PageHeader>
      {!isAuthenticated && <SignInGate />}
      <Importer authenticated={isAuthenticated} />
    </>
  );
}
function SignInGate() {
  const { signIn } = useAuthActions();
  return (
    <div className="data-card mx-auto max-w-2xl p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f2ef] text-[#2f726b]">
        <FileSpreadsheet />
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold">
        Sign in before importing private data
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        The public demo remains read-only. GitHub login creates a workspace
        boundary for your observations.
      </p>
      <Button
        className="mt-5 bg-[#173e3d] text-white"
        onClick={() => void signIn("github", { redirectTo: "/catalog" })}
      >
        <Github />
        Continue with GitHub
      </Button>
    </div>
  );
}
function Importer({ authenticated }: { authenticated: boolean }) {
  const { signIn } = useAuthActions();
  const workspaces = useQuery(api.workspaces.mine, authenticated ? {} : "skip");
  const importRows = useMutation(api.ingestion.importRows);
  const syncCampus = useAction(api.liveSources.syncCampus);
  const syncCaiStore = useAction(api.liveSources.syncCaiStore);
  const syncAdditionalUcpStore = useAction(
    api.liveSources.syncAdditionalUcpStore,
  );
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    inserted: number;
    duplicates: number;
  } | null>(null);
  const [caiSyncBusy, setCaiSyncBusy] = useState(false);
  const [caiSyncResult, setCaiSyncResult] = useState<{
    inserted: number;
    duplicates: number;
  } | null>(null);
  const [additionalBusy, setAdditionalBusy] = useState<string | null>(null);
  const [additionalResults, setAdditionalResults] = useState<
    Record<string, { inserted: number; duplicates: number }>
  >({});
  const [result, setResult] = useState<{
    inserted: number;
    duplicates: number;
  } | null>(null);
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setResult(null);
    if (!selected) {
      setParsed(null);
      return;
    }
    if (selected.size > 5_000_000) {
      setParsed({
        valid: [],
        errors: [
          {
            row: 0,
            field: "file",
            message: "File must be 5 MB or smaller.",
            value: selected.size,
          },
        ],
        headers: [],
      });
      return;
    }
    setParsed(parseObservationCsv(await selected.text()));
  }
  async function commit() {
    if (!authenticated) {
      await signIn("github", { redirectTo: "/catalog" });
      return;
    }
    const workspace = workspaces?.find(
      (item: any) => item.workspace,
    )?.workspace;
    if (!workspace || !file || !parsed?.valid.length) return;
    setBusy(true);
    try {
      const response = await importRows({
        workspaceId: workspace._id,
        fileName: file.name,
        rows: parsed.valid,
      });
      setResult(response);
    } finally {
      setBusy(false);
    }
  }
  async function syncLiveCampus() {
    const workspace = workspaces?.find(
      (item: any) => item.workspace,
    )?.workspace;
    if (!workspace) return;
    setSyncBusy(true);
    try {
      setSyncResult(
        await syncCampus({ workspaceId: workspace._id, limit: 24 }),
      );
    } finally {
      setSyncBusy(false);
    }
  }
  async function syncLiveCaiStore() {
    const workspace = workspaces?.find(
      (item: any) => item.workspace,
    )?.workspace;
    if (!workspace) return;
    setCaiSyncBusy(true);
    try {
      setCaiSyncResult(
        await syncCaiStore({ workspaceId: workspace._id, limit: 24 }),
      );
    } finally {
      setCaiSyncBusy(false);
    }
  }
  async function syncAdditional(store: "neemans" | "redtape" | "inc5") {
    const workspace = workspaces?.find(
      (item: any) => item.workspace,
    )?.workspace;
    if (!workspace) return;
    setAdditionalBusy(store);
    try {
      const response = await syncAdditionalUcpStore({
        workspaceId: workspace._id,
        store,
        limit: 24,
      });
      setAdditionalResults((current) => ({ ...current, [store]: response }));
    } finally {
      setAdditionalBusy(null);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([csvTemplate], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "solesignal-observations-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  if (authenticated && workspaces === undefined)
    return <div className="data-card h-56 animate-pulse" />;
  if (authenticated && !workspaces?.length)
    return (
      <div className="data-card p-8 text-center">
        <h2 className="font-display text-2xl font-semibold">
          Create your workspace first
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Onboarding sets the business constraints needed for opportunity
          scoring.
        </p>
        <a href="/onboarding">
          <Button className="mt-5">Start onboarding</Button>
        </a>
      </div>
    );
  return (
    <div>
      <div className="data-card mb-4 grid gap-4 p-5 lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold">Campus Shoes</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Pull current Campus prices, discounts, images, stock, and sizes
              through its permissioned public catalog.
            </p>
          </div>
          <Button
            onClick={syncLiveCampus}
            disabled={syncBusy}
            className="shrink-0 bg-[#173e3d] text-white"
          >
            <RefreshCw className={syncBusy ? "animate-spin" : ""} />
            {syncBusy ? "Syncing…" : "Sync Campus now"}
          </Button>
          {syncResult && (
            <p className="text-xs text-emerald-700">
              {syncResult.inserted} added · {syncResult.duplicates} already
              current
            </p>
          )}
        </div>
        <div className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold">
              The CAI Store
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Pull its explicitly permitted public product catalog.
            </p>
          </div>
          <Button
            onClick={syncLiveCaiStore}
            disabled={caiSyncBusy}
            variant="outline"
            className="shrink-0"
          >
            <RefreshCw className={caiSyncBusy ? "animate-spin" : ""} />
            {caiSyncBusy ? "Syncing…" : "Sync CAI Store"}
          </Button>
          {caiSyncResult && (
            <p className="text-xs text-emerald-700">
              {caiSyncResult.inserted} added · {caiSyncResult.duplicates}{" "}
              already current
            </p>
          )}
        </div>
        {(
          [
            ["neemans", "Neeman's"],
            ["redtape", "RedTape"],
            ["inc5", "INC.5"],
          ] as const
        ).map(([key, name]) => (
          <div
            key={key}
            className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
          >
            <div>
              <h2 className="font-display text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Permissioned UCP catalog · India prices and availability.
              </p>
            </div>
            <Button
              onClick={() => syncAdditional(key)}
              disabled={additionalBusy !== null}
              variant="outline"
              className="shrink-0"
            >
              <RefreshCw
                className={additionalBusy === key ? "animate-spin" : ""}
              />
              {additionalBusy === key ? "Syncing…" : `Sync ${name}`}
            </Button>
            {additionalResults[key] && (
              <p className="text-xs text-emerald-700">
                {additionalResults[key].inserted} added ·{" "}
                {additionalResults[key].duplicates} already current
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
        <div className="data-card p-5">
          <h2 className="font-display text-xl font-semibold">
            Upload observations
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            CSV only · maximum 5 MB · 1,000 rows per import batch
          </p>
          <label className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center hover:bg-muted/30">
            <Upload className="h-7 w-7 text-[#2f726b]" />
            <span className="mt-3 text-sm font-semibold">
              Choose a CSV file
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {file?.name ?? "or drop it here"}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={choose}
            />
          </label>
          <Button variant="outline" className="mt-3 w-full" onClick={download}>
            <Download />
            Download template
          </Button>
          {parsed && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/30">
                <p className="text-xl font-semibold">{parsed.valid.length}</p>
                <p className="text-[10px] uppercase">Valid rows</p>
              </div>
              <div className="rounded-xl bg-rose-50 p-3 text-rose-800 dark:bg-rose-950/30">
                <p className="text-xl font-semibold">{parsed.errors.length}</p>
                <p className="text-[10px] uppercase">Errors</p>
              </div>
            </div>
          )}
          <Button
            disabled={!parsed?.valid.length || !!parsed?.errors.length || busy}
            onClick={commit}
            className="mt-3 w-full bg-[#173e3d] text-white"
          >
            {busy
              ? "Importing…"
              : authenticated
                ? "Import valid rows"
                : "Sign in with GitHub to import"}
          </Button>
          {result && (
            <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              {result.inserted} inserted · {result.duplicates} duplicates safely
              skipped
            </div>
          )}
        </div>
        <div className="data-card overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-display text-xl font-semibold">
              Validation preview
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Errors include the exact row, field, and correction.
            </p>
          </div>
          {!parsed ? (
            <div className="grid min-h-80 place-items-center p-8 text-center text-sm text-muted-foreground">
              Select a file to inspect it before anything is written.
            </div>
          ) : parsed.errors.length ? (
            <div className="max-h-[500px] overflow-auto divide-y">
              {parsed.errors.map((error, index) => (
                <div
                  className="flex gap-3 p-4"
                  key={`${error.row}-${error.field}-${index}`}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div>
                    <p className="text-sm font-semibold">
                      Row {error.row} · {error.field}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {error.message}
                    </p>
                    {error.value != null && (
                      <code className="mt-2 block rounded bg-muted px-2 py-1 text-[10px]">
                        {String(error.value)}
                      </code>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b bg-muted/40 text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Title</th>
                    <th>Source</th>
                    <th>Price</th>
                    <th>Rank</th>
                    <th>Observed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsed.valid.slice(0, 20).map((row, index) => (
                    <tr key={index}>
                      <td className="max-w-[260px] truncate p-3 font-semibold">
                        {row.title}
                      </td>
                      <td>{row.source}</td>
                      <td>₹{row.price}</td>
                      <td>#{row.rank ?? "—"}</td>
                      <td>
                        {new Date(row.observed_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
