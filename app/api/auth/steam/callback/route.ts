import { NextRequest, NextResponse } from "next/server";
import { verifySteamCallback, getSteamProfile } from "@/lib/steam";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const params = new URL(request.url).searchParams;

  const steamId = await verifySteamCallback(params);
  if (!steamId) {
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
  }

  const profile = await getSteamProfile(steamId);

  const session = await getSession();
  session.steamId = steamId;
  session.personaName = profile?.personaname ?? "Unknown Player";
  session.avatarUrl = profile?.avatarfull ?? "";
  await session.save();

  return NextResponse.redirect(`${baseUrl}/dashboard`);
}
