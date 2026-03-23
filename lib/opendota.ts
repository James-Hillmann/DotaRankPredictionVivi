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
  observer_uses: number;
  sentry_uses: number;
  duration: number; // seconds
  player_slot: number;
  radiant_win: boolean;
  party_size: number | null;
  rank_tier: number | null; // avg rank of match
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

export async function fetchPlayerStats(accountId: number): Promise<PlayerStats> {
  const [player, wl, recentMatches, totals] = await Promise.all([
    opendotaFetch<PlayerData>(`/players/${accountId}`),
    opendotaFetch<WinLoss>(`/players/${accountId}/wl?limit=100`),
    opendotaFetch<RecentMatch[]>(`/players/${accountId}/recentMatches`),
    opendotaFetch<PlayerTotals[]>(`/players/${accountId}/totals`),
  ]);

  return { player, wl, recentMatches, totals };
}

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
