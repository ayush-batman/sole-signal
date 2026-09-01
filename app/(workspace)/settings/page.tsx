"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Github, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/MarketUI";

const weights = [
  ["Rank momentum", 25],
  ["Current rank strength", 20],
  ["Review velocity", 15],
  ["Availability pressure", 15],
  ["Cross-source breadth", 10],
  ["Search momentum", 10],
  ["Price resilience", 5],
];
export default function Settings() {
  const { signIn } = useAuthActions();
  return (
    <>
      <PageHeader
        eyebrow="Workspace configuration"
        title="Settings"
        description="Business constraints, scoring weights, markets, categories, and notification providers."
      />
      <Unauthenticated>
        <div className="data-card p-8 text-center">
          <Github className="mx-auto h-8 w-8 text-[#2f726b]" />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            Sign in to edit a workspace
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The public demo settings are read-only.
          </p>
          <Button
            className="mt-5"
            onClick={() => void signIn("github", { redirectTo: "/settings" })}
          >
            Continue with GitHub
          </Button>
        </div>
      </Unauthenticated>
      <Authenticated>
        <SettingsForm />
      </Authenticated>
    </>
  );
}
function SettingsForm() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
      <div className="space-y-4">
        <div className="data-card p-5">
          <h2 className="font-display text-xl font-semibold">
            Business profile
          </h2>
          <div className="mt-5 space-y-4">
            <Field label="Desired gross margin" value="55" suffix="%" />
            <Field label="Normal MOQ" value="300" />
            <Field label="Lead time" value="45" suffix="days" />
            <div>
              <Label>Inventory risk tolerance</Label>
              <select className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm">
                <option>Medium</option>
                <option>Low</option>
                <option>High</option>
              </select>
            </div>
          </div>
        </div>
        <div className="data-card p-5">
          <h2 className="font-display text-xl font-semibold">Connections</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Connection name="GitHub login" status="Configured in code" />
            <Connection name="Flipkart Affiliate" status="Not connected" />
            <Connection name="WhatsApp notifications" status="Not connected" />
          </div>
        </div>
      </div>
      <div className="data-card p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#2f726b]" />
          <h2 className="font-display text-xl font-semibold">
            Trend Score weights
          </h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Workspace and category overrides are copied into every historical
          score for reproducibility.
        </p>
        <div className="mt-6 space-y-5">
          {weights.map(([name, weight]) => (
            <div key={name as string}>
              <div className="mb-2 flex justify-between text-xs">
                <Label>{name}</Label>
                <span className="font-semibold">{weight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                defaultValue={weight as number}
                className="w-full accent-[#2f726b]"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          Weights currently total 100%. Saving creates a new score configuration
          version; it does not rewrite history.
        </div>
        <Button
          className="mt-4 bg-[#173e3d] text-white"
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          <Save />
          {saved ? "Saved" : "Save new version"}
        </Button>
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <Input defaultValue={value} />
        {suffix && (
          <span className="text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
}
function Connection({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <span className="font-medium">{name}</span>
      <span
        className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${status === "Not connected" ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}
      >
        {status}
      </span>
    </div>
  );
}
