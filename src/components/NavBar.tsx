"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { formatMoney } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Matches" },
  { href: "/props", label: "My Props" },
  { href: "/bets", label: "My Bets" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function NavBar() {
  const pathname = usePathname();
  const balance = useStore((s) => s.balance);
  const hydrated = useStore((s) => s.hydrated);
  const slipCount = useStore((s) => s.slip.length);
  const setSlipOpen = useStore((s) => s.setSlipOpen);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-900/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
          aria-label="PitchProps home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-pitch-500 text-white shadow-glow">
            ⚽
          </span>
          <span className="hidden text-lg sm:inline">
            Pitch<span className="text-pitch-400">Props</span>
          </span>
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main navigation"
        >
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`min-h-11 shrink-0 rounded-lg px-3 py-2 font-medium transition-colors ${
                  active ? "bg-ink-750 text-white" : "text-ink-300 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="rounded-xl border border-ink-700 bg-ink-800 px-3 py-1.5 text-right">
            <div className="text-[10px] uppercase tracking-wide text-ink-400">Balance</div>
            <div className="text-sm font-bold tabular-nums text-pitch-300">
              {hydrated ? formatMoney(balance) : "—"} <span className="text-ink-400">PC</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSlipOpen(true)}
            aria-label={slipCount > 0 ? `Open bet slip, ${slipCount} selections` : "Open bet slip"}
            className="relative min-h-11 min-w-11 rounded-xl border border-ink-600 bg-ink-750 px-3 py-2 text-sm font-semibold text-white hover:border-pitch-500 focus:outline-none focus:ring-2 focus:ring-pitch-500/50"
          >
            Slip
            {slipCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-pitch-500 px-1 text-[11px] font-bold text-white"
                aria-hidden
              >
                {slipCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
