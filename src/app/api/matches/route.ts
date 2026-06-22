import { NextResponse } from "next/server";
import { fetchMatches } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchMatches();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
