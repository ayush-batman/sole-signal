"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Onboarding() {
  const create = useMutation(api.workspaces.createAndOnboard);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await create({
        name: String(data.get("name")),
        businessType: String(data.get("businessType")),
        targetCustomer: String(data.get("targetCustomer")),
        audiences: ["men", "women", "unisex"],
        categories: ["casual", "comfort", "performance"],
        competitors: String(data.get("competitors"))
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        desiredGrossMargin: Number(data.get("margin")),
        normalMoq: Number(data.get("moq")),
        leadTimeDays: Number(data.get("leadTime")),
        riskTolerance: String(data.get("risk")),
      });
      router.push("/dashboard");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create workspace.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#071b1d] p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-3xl bg-background p-6 shadow-2xl sm:p-9"
      >
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8ff72] text-[#071b1d]">
            <Footprints className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">
              Set up your decision profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Recommendations use these real business constraints.
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Business name"
            name="name"
            placeholder="Signal Footwear"
          />
          <div>
            <Label htmlFor="businessType">Business type</Label>
            <select
              id="businessType"
              name="businessType"
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="manufacturer">Manufacturer</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="retailer">Retailer</option>
              <option value="marketplace_seller">Marketplace seller</option>
              <option value="d2c">D2C</option>
            </select>
          </div>
          <Field
            label="Target customer"
            name="targetCustomer"
            placeholder="Urban adults, 18–40"
          />
          <Field
            label="Competitors"
            name="competitors"
            placeholder="Campus, Bata, Puma"
          />
          <Field
            label="Desired gross margin (%)"
            name="margin"
            type="number"
            defaultValue="55"
          />
          <Field
            label="Normal MOQ"
            name="moq"
            type="number"
            defaultValue="300"
          />
          <Field
            label="Lead time (days)"
            name="leadTime"
            type="number"
            defaultValue="45"
          />
          <div>
            <Label htmlFor="risk">Inventory risk tolerance</Label>
            <select
              id="risk"
              name="risk"
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        <Button
          className="mt-7 h-11 w-full bg-[#173e3d] text-white"
          disabled={busy}
        >
          {busy ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>
    </main>
  );
}
function Field({
  label,
  name,
  ...props
}: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} required className="mt-2" {...props} />
    </div>
  );
}
