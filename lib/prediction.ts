import { RecentMatch, WinLoss, STANDARD_GAME_MODES } from "./opendota";

export interface StatBreakdown {
  label: string;
  value: string;
  score: number; // 0–100
  weight: number;
  description: string;
}

export interface PredictionResult {
  estimatedMmr: number;
  rankLabel: string;
  medalNumber: number; // 1–8
  stars: number; // 1–5 (0 for Immortal)
  confidence: "low" | "medium" | "high";
  breakdown: StatBreakdown[];
  winRate: number;
  totalGames: number;
  matchesAnalyzed: number;
}

// Clamp a value between 0 and 100
function clamp(v: number): number {
  return Math.min(100, Math.max(0, v));
}

// Linear interpolation: maps value in [lo, hi] → [0, 100]
function normalize(value: number, lo: number, hi: number): number {
  return clamp(((value - lo) / (hi - lo)) * 100);
}

// Weighted stats benchmarks
// lo = roughly Herald 1, hi = roughly Immortal top
const BENCHMARKS = {
  kda: { lo: 0.8, hi: 5.0 },
  gpm: { lo: 200, hi: 680 },
  xpm: { lo: 250, hi: 720 },
  lastHitsPerMin: { lo: 1.5, hi: 8.5 },
  heroDamagePerMin: { lo: 200, hi: 1100 },
  towerDamagePerMin: { lo: 10, hi: 150 },
  healingPerMin: { lo: 0, hi: 200 },
  wardsPerGame: { lo: 0, hi: 8 },
  winRate: { lo: 40, hi: 65 },
};

const WEIGHTS = {
  kda: 0.18,
  gpm: 0.20,
  xpm: 0.15,
  lastHitsPerMin: 0.15,
  heroDamagePerMin: 0.12,
  towerDamagePerMin: 0.05,
  healingPerMin: 0.05,
  wardsPerGame: 0.05,
  winRate: 0.05,
};

// Score (0–100) → estimated MMR
// Herald 1 = 0 MMR, Immortal floor = 5420 MMR
function scoreToMmr(score: number): number {
  const mmrCurve: [number, number][] = [
    [0, 0],
    [12, 384],    // mid Herald
    [25, 1150],   // mid Guardian
    [37, 1920],   // mid Crusader
    [50, 2690],   // mid Archon
    [62, 3460],   // mid Legend
    [75, 4230],   // mid Ancient
    [87, 5000],   // mid Divine
    [100, 6500],  // Immortal top
  ];

  for (let i = 1; i < mmrCurve.length; i++) {
    const [s0, mmr0] = mmrCurve[i - 1];
    const [s1, mmr1] = mmrCurve[i];
    if (score <= s1) {
      const t = (score - s0) / (s1 - s0);
      return Math.round(mmr0 + t * (mmr1 - mmr0));
    }
  }
  return 6500;
}

function mmrToRank(mmr: number): { rankLabel: string; medalNumber: number; stars: number } {
  const brackets: [number, number, string][] = [
    [0, 769, "Herald"],
    [770, 1539, "Guardian"],
    [1540, 2309, "Crusader"],
    [2310, 3079, "Archon"],
    [3080, 3849, "Legend"],
    [3850, 4619, "Ancient"],
    [4620, 5419, "Divine"],
    [5420, Infinity, "Immortal"],
  ];

  for (let medal = 0; medal < brackets.length; medal++) {
    const [lo, hi, name] = brackets[medal];
    if (mmr <= hi || medal === brackets.length - 1) {
      if (name === "Immortal") {
        return { rankLabel: "Immortal", medalNumber: 8, stars: 0 };
      }
      const range = hi - lo + 1;
      const stars = Math.min(5, Math.ceil(((mmr - lo) / range) * 5)) || 1;
      return { rankLabel: `${name} ${stars}`, medalNumber: medal + 1, stars };
    }
  }
  return { rankLabel: "Herald 1", medalNumber: 1, stars: 1 };
}

export function predictRank(
  matches: RecentMatch[],
  wl: WinLoss
): PredictionResult {
  // Filter to standard game modes only (no turbo, ability draft, etc.)
  const filtered = matches.filter((m) => STANDARD_GAME_MODES.includes(m.game_mode));

  if (filtered.length === 0) {
    return {
      estimatedMmr: 0,
      rankLabel: "Not enough data",
      medalNumber: 1,
      stars: 1,
      confidence: "low",
      breakdown: [],
      winRate: 0,
      totalGames: 0,
      matchesAnalyzed: 0,
    };
  }

  // Compute per-match averages
  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalGpm = 0, totalXpm = 0, totalLh = 0;
  let totalHeroDmg = 0, totalTowerDmg = 0, totalHealing = 0;
  let totalObserver = 0, totalSentry = 0;
  let totalDuration = 0;

  for (const m of filtered) {
    const durationMin = m.duration / 60;
    totalKills += m.kills;
    totalDeaths += m.deaths;
    totalAssists += m.assists;
    totalGpm += m.gold_per_min;
    totalXpm += m.xp_per_min;
    totalLh += m.last_hits / durationMin;
    totalHeroDmg += m.hero_damage / durationMin;
    totalTowerDmg += (m.tower_damage ?? 0) / durationMin;
    totalHealing += (m.hero_healing ?? 0) / durationMin;
    // OpenDota uses obs_placed/sen_placed in some endpoints, observer_uses/sentry_uses in others
    totalObserver += (m.obs_placed ?? m.observer_uses ?? 0);
    totalSentry += (m.sen_placed ?? m.sentry_uses ?? 0);
    totalDuration += durationMin;
  }

  const n = filtered.length;
  const avgDeaths = totalDeaths / n;
  const kda = avgDeaths === 0
    ? (totalKills + totalAssists) / n
    : (totalKills + totalAssists) / totalDeaths;
  const avgGpm = totalGpm / n;
  const avgXpm = totalXpm / n;
  const avgLhPerMin = totalLh / n;
  const avgHeroDmgPerMin = totalHeroDmg / n;
  const avgTowerDmgPerMin = totalTowerDmg / n;
  const avgHealingPerMin = totalHealing / n;
  const avgWardsPerGame = (totalObserver + totalSentry) / n;

  // Compute win rate from filtered matches directly (avoids wl endpoint game-mode issues)
  const filteredWins = filtered.filter((m) => {
    const isRadiant = m.player_slot < 128;
    return isRadiant ? m.radiant_win : !m.radiant_win;
  }).length;
  const winRate = n > 0 ? (filteredWins / n) * 100 : 50;

  // All-time game count from the wl endpoint (unfiltered)
  const totalGames = wl.win + wl.lose;

  // Normalize each stat to 0–100
  const scores = {
    kda: normalize(kda, BENCHMARKS.kda.lo, BENCHMARKS.kda.hi),
    gpm: normalize(avgGpm, BENCHMARKS.gpm.lo, BENCHMARKS.gpm.hi),
    xpm: normalize(avgXpm, BENCHMARKS.xpm.lo, BENCHMARKS.xpm.hi),
    lastHitsPerMin: normalize(avgLhPerMin, BENCHMARKS.lastHitsPerMin.lo, BENCHMARKS.lastHitsPerMin.hi),
    heroDamagePerMin: normalize(avgHeroDmgPerMin, BENCHMARKS.heroDamagePerMin.lo, BENCHMARKS.heroDamagePerMin.hi),
    towerDamagePerMin: normalize(avgTowerDmgPerMin, BENCHMARKS.towerDamagePerMin.lo, BENCHMARKS.towerDamagePerMin.hi),
    healingPerMin: normalize(avgHealingPerMin, BENCHMARKS.healingPerMin.lo, BENCHMARKS.healingPerMin.hi),
    wardsPerGame: normalize(avgWardsPerGame, BENCHMARKS.wardsPerGame.lo, BENCHMARKS.wardsPerGame.hi),
    winRate: normalize(winRate, BENCHMARKS.winRate.lo, BENCHMARKS.winRate.hi),
  };

  // Weighted average score
  const overallScore =
    scores.kda * WEIGHTS.kda +
    scores.gpm * WEIGHTS.gpm +
    scores.xpm * WEIGHTS.xpm +
    scores.lastHitsPerMin * WEIGHTS.lastHitsPerMin +
    scores.heroDamagePerMin * WEIGHTS.heroDamagePerMin +
    scores.towerDamagePerMin * WEIGHTS.towerDamagePerMin +
    scores.healingPerMin * WEIGHTS.healingPerMin +
    scores.wardsPerGame * WEIGHTS.wardsPerGame +
    scores.winRate * WEIGHTS.winRate;

  const estimatedMmr = scoreToMmr(overallScore);
  const { rankLabel, medalNumber, stars } = mmrToRank(estimatedMmr);
  const confidence = n >= 15 ? "high" : n >= 7 ? "medium" : "low";

  const breakdown: StatBreakdown[] = [
    {
      label: "KDA",
      value: kda.toFixed(2),
      score: scores.kda,
      weight: WEIGHTS.kda,
      description: `${(totalKills / n).toFixed(1)}K / ${avgDeaths.toFixed(1)}D / ${(totalAssists / n).toFixed(1)}A`,
    },
    {
      label: "Gold Per Minute",
      value: avgGpm.toFixed(0),
      score: scores.gpm,
      weight: WEIGHTS.gpm,
      description: "Average GPM across recent matches",
    },
    {
      label: "XP Per Minute",
      value: avgXpm.toFixed(0),
      score: scores.xpm,
      weight: WEIGHTS.xpm,
      description: "Average XPM across recent matches",
    },
    {
      label: "Last Hits / Min",
      value: avgLhPerMin.toFixed(1),
      score: scores.lastHitsPerMin,
      weight: WEIGHTS.lastHitsPerMin,
      description: "CS efficiency — a key skill differentiator",
    },
    {
      label: "Hero Damage / Min",
      value: avgHeroDmgPerMin.toFixed(0),
      score: scores.heroDamagePerMin,
      weight: WEIGHTS.heroDamagePerMin,
      description: "Fighting impact per minute",
    },
    {
      label: "Tower Damage / Min",
      value: avgTowerDmgPerMin.toFixed(0),
      score: scores.towerDamagePerMin,
      weight: WEIGHTS.towerDamagePerMin,
      description: "Objective focus and game sense",
    },
    {
      label: "Healing / Min",
      value: avgHealingPerMin.toFixed(0),
      score: scores.healingPerMin,
      weight: WEIGHTS.healingPerMin,
      description: "Support impact (relevant for support heroes)",
    },
    {
      label: "Wards Per Game",
      value: avgWardsPerGame.toFixed(1),
      score: scores.wardsPerGame,
      weight: WEIGHTS.wardsPerGame,
      description: avgWardsPerGame === 0
        ? "No ward data — OpenDota only tracks wards on fully parsed matches"
        : "Observer + sentry wards placed per game",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      score: scores.winRate,
      weight: WEIGHTS.winRate,
      description: `${filteredWins}W / ${n - filteredWins}L across ${n} standard-mode matches`,
    },
  ];

  return {
    estimatedMmr,
    rankLabel,
    medalNumber,
    stars,
    confidence,
    breakdown,
    winRate,
    totalGames,
    matchesAnalyzed: n,
  };
}
