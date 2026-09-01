"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  Activity,
  Bell,
  Boxes,
  ChartNoAxesCombined,
  ChevronDown,
  CircleGauge,
  FileChartColumn,
  FlaskConical,
  Footprints,
  GalleryVerticalEnd,
  Menu,
  PackageSearch,
  Search,
  Settings,
  Store,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useWorkspace } from "@/lib/useWorkspace";

const nav = [
  ["Dashboard", "/dashboard", CircleGauge],
  ["Trends", "/trends", ChartNoAxesCombined],
  ["Products", "/products", PackageSearch],
  ["Opportunities", "/opportunities", FlaskConical],
  ["Competitors", "/competitors", Store],
  ["Research", "/research", Search],
  ["Catalog", "/catalog", Boxes],
  ["Alerts", "/alerts", Bell],
  ["Sources", "/sources", Activity],
  ["Weekly report", "/reports/weekly", FileChartColumn],
] as const;

const desktopQuery = "(min-width: 1024px)";

function subscribeToDesktopQuery(onChange: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const desktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
  const navigationVisible = desktop || open;
  const { signIn, signOut } = useAuthActions();
  const { workspace, usingDemo } = useWorkspace();
  return (
    <div className="min-h-screen bg-[hsl(var(--shell))] text-foreground">
      <aside
        aria-hidden={!navigationVisible}
        inert={!navigationVisible}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col border-r border-white/10 bg-[#071b1d] text-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d8ff72] text-[#071b1d]">
              <Footprints className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[17px] font-semibold tracking-tight">
                SoleSignal
              </span>
              <span className="block text-[10px] uppercase tracking-[.19em] text-white/55">
                Market intelligence
              </span>
            </span>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="mx-4 mb-2 rounded-xl border border-white/10 bg-white/[.05] p-2.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">
              {workspace?.name ?? "India Footwear Demo"}
            </span>
            <ChevronDown className="h-4 w-4 text-white/40" />
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#d8ff72]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d8ff72]" />
            {usingDemo ? "Demo data · India" : "Live workspace · India"}
          </div>
        </div>
        <nav
          className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-2"
          aria-label="Main navigation"
        >
          {nav.map(([label, href, Icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-white text-[#071b1d]"
                    : "text-white/65 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-[17px] w-[17px]" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 space-y-1.5 px-3 pb-3">
          <Link
            href="/settings"
            className={cn(
              "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium",
              pathname === "/settings"
                ? "bg-white text-[#071b1d]"
                : "text-white/65 hover:bg-white/10 hover:text-white",
            )}
          >
            <Settings className="h-[17px] w-[17px]" />
            Settings
          </Link>
          <div className="rounded-xl border border-white/10 bg-white/[.04] p-2.5 text-[11px] text-white/60">
            <p className="font-medium text-white">Coverage is honest</p>
            <p className="mt-1 leading-relaxed">
              {usingDemo
                ? "72 synthetic observations. No live sales claims."
                : "Live catalog observations. Demand is not inferred without history."}
            </p>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu overlay"
        />
      )}
      <div
        className="lg:pl-[258px]"
        aria-hidden={open && !desktop}
        inert={open && !desktop}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg border p-2 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <GalleryVerticalEnd className="h-4 w-4" /> India <span>/</span>{" "}
              All footwear
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link href="/catalog" className="hidden sm:block">
              <Button size="sm" variant="outline">
                <Upload />
                Import CSV
              </Button>
            </Link>
            <Authenticated>
              <Button size="sm" variant="ghost" onClick={() => void signOut()}>
                Sign out
              </Button>
            </Authenticated>
            <Unauthenticated>
              <Button
                size="sm"
                className="bg-[#173e3d] text-white hover:bg-[#0d2d2d]"
                onClick={() => void signIn("github", { redirectTo: pathname })}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M12 .7A11.3 11.3 0 0 0 8.4 22.8c.6.1.8-.3.8-.6v-2.3c-3.4.7-4.1-1.4-4.1-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.2-3.1c-.1-.3-.5-1.6.1-3.1 0 0 1-.3 3.1 1.2a10.7 10.7 0 0 1 5.7 0c2.2-1.5 3.1-1.2 3.1-1.2.6 1.5.2 2.8.1 3.1a4.7 4.7 0 0 1 1.2 3.1c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.3 11.3 0 0 0 12 .7Z" />
                </svg>
                Sign in
              </Button>
            </Unauthenticated>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
