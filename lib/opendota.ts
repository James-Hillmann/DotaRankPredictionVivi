const OPENDOTA_BASE = "https://api.opendota.com/api";

export interface PlayerData {
  profile: {
    account_id: number;
    personaname: string;
    avatarfull: string;
  };
  rank_tier: number | null;
  mmr_estimate?: { estimate: number };
}

export interface WinLoss {
  win: number;
  lose: number;
}

export interface RecentMatch {
  match_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  last_hits: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  // Ward fields — OpenDota uses different names across endpoints
  observer_uses: number | null;
  sentry_uses: number | null;
  obs_placed: number | null;
  sen_placed: number | null;
  duration: number; // seconds
  player_slot: number;
  radiant_win: boolean;
  party_size: number | null;
  rank_tier: number | null; // avg rank of match
  game_mode: number; // 1=AP, 2=CM, 3=RD, 4=SD, 5=AR, 16=CD, 22=Ranked AP, 23=Turbo
  lobby_type: number | null;
}

export interface PlayerTotals {
  field: string;
  n: number;
  sum: number;
}

export interface PlayerStats {
  player: PlayerData;
  wl: WinLoss;
  recentMatches: RecentMatch[];
  totals: PlayerTotals[];
}

async function opendotaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${OPENDOTA_BASE}${path}`, {
    next: { revalidate: 300 }, // cache for 5 minutes
  });
  if (!res.ok) throw new Error(`OpenDota API error: ${res.status} for ${path}`);
  return res.json();
}

// Standard game modes: All Pick, CM, Random Draft, Single Draft, All Random, CD, Ranked AP
const STANDARD_GAME_MODES = [1, 2, 3, 4, 5, 16, 22];
const GAME_MODE_FILTER = STANDARD_GAME_MODES.map((m) => `game_mode=${m}`).join("&");

export async function fetchPlayerStats(accountId: number): Promise<PlayerStats> {
  const [player, wl, recentMatches, totals] = await Promise.all([
    opendotaFetch<PlayerData>(`/players/${accountId}`),
    opendotaFetch<WinLoss>(`/players/${accountId}/wl?${GAME_MODE_FILTER}`),
    opendotaFetch<RecentMatch[]>(`/players/${accountId}/recentMatches`),
    opendotaFetch<PlayerTotals[]>(`/players/${accountId}/totals`),
  ]);

  return { player, wl, recentMatches, totals };
}

export { STANDARD_GAME_MODES };

export function rankTierToLabel(tier: number | null): string {
  if (!tier) return "Unranked";
  const medal = Math.floor(tier / 10);
  const stars = tier % 10;
  const medals: Record<number, string> = {
    1: "Herald",
    2: "Guardian",
    3: "Crusader",
    4: "Archon",
    5: "Legend",
    6: "Ancient",
    7: "Divine",
    8: "Immortal",
  };
  const medalName = medals[medal] ?? "Unknown";
  if (medal === 8) return "Immortal";
  return `${medalName} ${stars}`;
}
