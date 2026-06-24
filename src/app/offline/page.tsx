"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mb-3 text-4xl">📡</div>
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-ink-300">
        PitchProps needs a connection for live odds and scores. Cached pages may still be available.
      </p>
      <Link href="/" className="btn-primary mt-5 inline-flex">
        Retry
      </Link>
    </div>
  );
}
