"use client";

import { useEffect, useState } from "react";
import RankBadge from "@/components/RankBadge";
import StatBar from "@/components/StatBar";
import type { PredictionResult } from "@/lib/prediction";

interface PlayerResponse {
  prediction: PredictionResult;
  wl: { win: number; lose: number };
  player: {
    rank_tier: number | null;
    mmr_estimate?: { estimate: number };
  };
  error?: string;
}

interface Props {
  personaName: string;
  avatarUrl: string;
}

export default function DashboardClient({ personaName, avatarUrl }: Props) {
  const [data, setData] = useState<PlayerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/player")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load player data."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="font-bold text-white text-lg">
            <span className="text-red-400">Dota 2</span> Rank Predictor
          </span>
          <div className="flex items-center gap-3">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={personaName} className="h-8 w-8 rounded-full border border-gray-700" />
            )}
            <span className="text-sm text-gray-300">{personaName}</span>
            <a
              href="/api/auth/logout"
              className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Sign out
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-24 text-gray-400">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-red-500" />
            <p>Fetching your match data from OpenDota...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-900/30 border border-red-700 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-300 mb-2">Could not load data</h2>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="mt-3 text-sm text-gray-500">
              Make sure your OpenDota profile is set to <strong className="text-gray-300">public</strong>.{" "}
              Visit{" "}
              <a
                href="https://www.opendota.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                opendota.com
              </a>{" "}
              and enable public data sharing.
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-white">Your Rank Prediction</h1>
              <p className="text-gray-400 mt-1 text-sm">
                Based on your last {data.prediction.matchesAnalyzed} matches from OpenDota.
              </p>
            </div>

            {/* Top row: Badge + Summary cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Predicted rank */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-900 border border-gray-800 p-8 lg:col-span-1">
                <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Predicted Rank
                </p>
                <RankBadge
                  medalNumber={data.prediction.medalNumber}
                  stars={data.prediction.stars}
                  rankLabel={data.prediction.rankLabel}
                  estimatedMmr={data.prediction.estimatedMmr}
                  confidence={data.prediction.confidence}
                />
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4 lg:col-span-2 content-start">
                {[
                  {
                    label: "Win Rate",
                    value: `${((data.wl.win / (data.wl.win + data.wl.lose)) * 100).toFixed(1)}%`,
                    sub: `${data.wl.win}W / ${data.wl.lose}L all time`,
                    color: data.wl.win / (data.wl.win + data.wl.lose) >= 0.5 ? "text-green-400" : "text-red-400",
                  },
                  {
                    label: "Total Games",
                    value: data.prediction.totalGames.toLocaleString(),
                    sub: "all time",
                    color: "text-blue-400",
                  },
                  {
                    label: "Est. MMR",
                    value: data.prediction.estimatedMmr.toLocaleString(),
                    sub: "predicted",
                    color: "text-yellow-400",
                  },
                  {
                    label: "Confidence",
                    value: data.prediction.confidence.charAt(0).toUpperCase() + data.prediction.confidence.slice(1),
                    sub: "based on recent data",
                    color:
                      data.prediction.confidence === "high"
                        ? "text-green-400"
                        : data.prediction.confidence === "medium"
                        ? "text-yellow-400"
                        : "text-red-400",
                  },
                ].map(({ label, value, sub, color }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-gray-900 border border-gray-800 p-5"
                  >
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat breakdown */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Performance Breakdown</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.prediction.breakdown.map((stat) => (
                  <StatBar
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    score={stat.score}
                    weight={stat.weight}
                    description={stat.description}
                  />
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-700 text-center pb-4">
              This prediction is based on rule-based stat analysis, not Valve&apos;s official MMR system.
              Results may vary. Data sourced from OpenDota API.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
