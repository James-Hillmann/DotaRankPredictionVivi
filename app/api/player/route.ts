import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { steam64ToAccountId } from "@/lib/steam";
import { fetchPlayerStats } from "@/lib/opendota";
import { predictRank } from "@/lib/prediction";

export async function GET() {
  const session = await getSession();
  if (!session.steamId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accountId = steam64ToAccountId(session.steamId);

  try {
    const stats = await fetchPlayerStats(accountId);
    const prediction = predictRank(stats.recentMatches, stats.wl);

    return NextResponse.json({
      player: stats.player,
      wl: stats.wl,
      prediction,
      sessionProfile: {
        personaName: session.personaName,
        avatarUrl: session.avatarUrl,
      },
    });
  } catch (err) {
    console.error("OpenDota fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch player data. The profile may be private." },
      { status: 500 }
    );
  }
}
