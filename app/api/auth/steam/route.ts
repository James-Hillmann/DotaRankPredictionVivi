import { NextResponse } from "next/server";
import { buildSteamAuthUrl } from "@/lib/steam";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const returnTo = `${baseUrl}/api/auth/steam/callback`;
  const authUrl = buildSteamAuthUrl(returnTo, baseUrl);
  return NextResponse.redirect(authUrl);
}
