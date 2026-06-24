import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MatchesProvider } from "@/components/MatchesProvider";
import { ScoresProvider } from "@/components/ScoresProvider";
import { NavBar } from "@/components/NavBar";
import { BetSlip } from "@/components/BetSlip";
import { SettlementWatcher } from "@/components/SettlementWatcher";
import { Toaster } from "@/components/Toaster";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "PitchProps — Soccer Prop Bets",
  description:
    "A proprietary play-money soccer prop betting platform with live odds, parlays, and fun performance tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PitchProps",
    statusBarStyle: "black-translucent",
  },
  applicationName: "PitchProps",
};

export const viewport: Viewport = {
  themeColor: "#3ddc84",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeInit = `(function(){try{var t=localStorage.getItem('pitchprops-theme')||'dark';document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        <MatchesProvider>
          <ScoresProvider>
            <SettlementWatcher />
            <NavBar />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
            <BetSlip />
            <Toaster />
            <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-ink-500">
              PitchProps · Play-money entertainment only · No real wagering.
            </footer>
          </ScoresProvider>
        </MatchesProvider>
      </body>
    </html>
  );
}
