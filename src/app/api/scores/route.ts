import { NextResponse } from "next/server";
import { fetchScores } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchScores();
  return NextResponse.json(result, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
