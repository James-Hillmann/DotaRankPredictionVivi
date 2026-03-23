const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_REGEX = /https:\/\/steamcommunity\.com\/openid\/id\/(\d+)/;

export function buildSteamAuthUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamCallback(
  params: URLSearchParams
): Promise<string | null> {
  // Build verification request
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
  });

  const text = await response.text();
  if (!text.includes("is_valid:true")) return null;

  const claimedId = params.get("openid.claimed_id") ?? "";
  const match = claimedId.match(STEAM_ID_REGEX);
  return match ? match[1] : null;
}

// Convert Steam64 ID to OpenDota account_id (32-bit)
export function steam64ToAccountId(steam64: string): number {
  return Number(BigInt(steam64) - BigInt("76561197960265728"));
}

export interface SteamProfile {
  personaname: string;
  avatarfull: string;
  steamid: string;
}

export async function getSteamProfile(steamId: string): Promise<SteamProfile | null> {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const players = data?.response?.players;
  return players?.[0] ?? null;
}
