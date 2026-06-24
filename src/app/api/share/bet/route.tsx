import { ImageResponse } from "next/og";
import type { PlacedBet } from "@/lib/types";

export const runtime = "edge";

export async function POST(req: Request) {
  let bet: PlacedBet;
  try {
    const body = (await req.json()) as { bet?: PlacedBet };
    if (!body.bet) throw new Error("missing bet");
    bet = body.bet;
  } catch {
    return new Response("Invalid bet payload", { status: 400 });
  }

  const statusColor =
    bet.status === "won" ? "#3ddc84" : bet.status === "lost" ? "#ff5d6c" : "#f5c542";
  const legs = bet.legs.slice(0, 4).map((l) => `${l.selectionLabel} @ ${l.price.toFixed(2)}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          background: "linear-gradient(145deg, #0a0e14 0%, #121826 100%)",
          color: "#e8edf6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 700 }}>⚽ PitchProps</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: statusColor,
              textTransform: "uppercase",
            }}
          >
            {bet.status}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
            {bet.type === "parlay" ? `${bet.legs.length}-leg parlay` : "Single bet"} · {bet.odds.toFixed(2)}
          </div>
          <div style={{ fontSize: 20, color: "#8b97b3", marginBottom: 24 }}>
            Stake {bet.stake} PC · {"★".repeat(bet.confidence)}
          </div>
          {legs.map((line) => (
            <div key={line} style={{ fontSize: 22, marginBottom: 8 }}>
              {line}
            </div>
          ))}
          {bet.legs.length > 4 ? (
            <div style={{ fontSize: 18, color: "#8b97b3" }}>+{bet.legs.length - 4} more legs</div>
          ) : null}
        </div>
        <div style={{ fontSize: 18, color: "#5b6885" }}>Play-money only · pitchprops.vercel.app</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
