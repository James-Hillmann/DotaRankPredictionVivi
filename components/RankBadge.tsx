"use client";

interface RankBadgeProps {
  medalNumber: number; // 1–8
  stars: number; // 0–5
  rankLabel: string;
  estimatedMmr: number;
  confidence: "low" | "medium" | "high";
}

const MEDAL_COLORS: Record<number, { from: string; to: string; border: string }> = {
  1: { from: "from-gray-500", to: "to-gray-700", border: "border-gray-500" },      // Herald
  2: { from: "from-teal-600", to: "to-teal-800", border: "border-teal-500" },      // Guardian
  3: { from: "from-green-500", to: "to-green-700", border: "border-green-400" },   // Crusader
  4: { from: "from-blue-500", to: "to-blue-700", border: "border-blue-400" },      // Archon
  5: { from: "from-indigo-500", to: "to-indigo-700", border: "border-indigo-400" }, // Legend
  6: { from: "from-purple-500", to: "to-purple-700", border: "border-purple-400" }, // Ancient
  7: { from: "from-yellow-400", to: "to-orange-500", border: "border-yellow-400" }, // Divine
  8: { from: "from-red-500", to: "to-rose-700", border: "border-red-400" },         // Immortal
};

const MEDAL_NAMES: Record<number, string> = {
  1: "Herald", 2: "Guardian", 3: "Crusader", 4: "Archon",
  5: "Legend", 6: "Ancient", 7: "Divine", 8: "Immortal",
};

const CONFIDENCE_COLORS = {
  low: "text-red-400 bg-red-950 border-red-800",
  medium: "text-yellow-400 bg-yellow-950 border-yellow-800",
  high: "text-green-400 bg-green-950 border-green-800",
};

export default function RankBadge({ medalNumber, stars, rankLabel, estimatedMmr, confidence }: RankBadgeProps) {
  const colors = MEDAL_COLORS[medalNumber] ?? MEDAL_COLORS[1];
  const medalName = MEDAL_NAMES[medalNumber] ?? "Unknown";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Medal circle */}
      <div
        className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br ${colors.from} ${colors.to} border-4 ${colors.border} shadow-2xl`}
      >
        <div className="text-center">
          <div className="text-4xl font-black text-white drop-shadow-lg">{medalName[0]}</div>
          <div className="text-xs font-bold text-white/80 uppercase tracking-widest">{medalName}</div>
        </div>
        {/* Stars */}
        {stars > 0 && (
          <div className="absolute -bottom-4 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                className={`h-4 w-4 ${i < stars ? "fill-yellow-400" : "fill-gray-700"}`}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
              </svg>
            ))}
          </div>
        )}
      </div>

      {/* Rank label */}
      <div className="mt-6 text-center">
        <div className="text-2xl font-bold text-white">{rankLabel}</div>
        <div className="text-sm text-gray-400">~{estimatedMmr.toLocaleString()} MMR</div>
      </div>

      {/* Confidence badge */}
      <span
        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${CONFIDENCE_COLORS[confidence]}`}
      >
        {confidence} confidence
      </span>
    </div>
  );
}
