"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ArrowRight,
  Check,
  Footprints,
  Github,
  LineChart,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShoeArt } from "@/components/MarketUI";

export default function Home() {
  const { signIn } = useAuthActions();
  return (
    <main className="min-h-screen overflow-hidden bg-[#071b1d] text-white">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8ff72] text-[#071b1d]">
            <Footprints className="h-5 w-5" />
          </span>
          <span className="font-semibold tracking-tight">SoleSignal</span>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              Explore demo
            </Button>
          </Link>
          <Button
            className="bg-white text-[#071b1d] hover:bg-white/90"
            onClick={() => void signIn("github", { redirectTo: "/onboarding" })}
          >
            <Github />
            Sign in
          </Button>
        </div>
      </nav>
      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d8ff72]/30 bg-[#d8ff72]/10 px-3 py-1.5 text-xs text-[#d8ff72]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Evidence before narrative
          </div>
          <h1 className="max-w-3xl font-display text-5xl leading-[.98] tracking-[-.045em] sm:text-7xl">
            Know which shoes India wants{" "}
            <span className="text-[#d8ff72]">next.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">
            SoleSignal separates demand from discounting and saturation—then
            tells footwear teams what to manufacture, source, test, reorder,
            watch, or avoid.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-12 bg-[#d8ff72] px-6 text-[#071b1d] hover:bg-[#c7ef61]"
              onClick={() =>
                void signIn("github", { redirectTo: "/onboarding" })
              }
            >
              <Github />
              Continue with GitHub
            </Button>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                View the demo <ArrowRight />
              </Button>
            </Link>
          </div>
          <div className="mt-9 grid max-w-xl gap-3 text-sm text-white/55 sm:grid-cols-3">
            {[
              [Upload, "Validated CSV"],
              [LineChart, "Inspectable scores"],
              [Check, "Open-source stack"],
            ].map(([Icon, label]) => (
              <div className="flex items-center gap-2" key={String(label)}>
                <Icon className="h-4 w-4 text-[#d8ff72]" />
                {label as string}
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-20 rounded-full bg-[#d8ff72]/10 blur-3xl" />
          <div className="relative rotate-[1deg] rounded-[28px] border border-white/10 bg-[#f6f3eb] p-4 text-[#0c2929] shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.15em] text-[#2f726b]">
                  Rising now
                </p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  Retro suede sneakers
                </p>
              </div>
              <span className="rounded-full bg-[#d8ff72] px-3 py-1 text-xs font-bold">
                84 trend
              </span>
            </div>
            <ShoeArt className="h-52 sm:h-64" />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ["78", "Opportunity"],
                ["41", "Saturation"],
                ["89%", "Confidence"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-xl border border-black/10 bg-white p-3"
                >
                  <p className="text-xl font-semibold">{value}</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[.1em] text-black/45">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-black/55">
              <strong className="text-black/80">Why:</strong> Rank and reviews
              improved across two synthetic sources while price held. Demand is
              estimated, not unit sales.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
