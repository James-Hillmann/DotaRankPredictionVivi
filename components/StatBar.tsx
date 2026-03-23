"use client";

interface StatBarProps {
  label: string;
  value: string;
  score: number; // 0–100
  weight: number;
  description: string;
}

function scoreColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 25) return "bg-orange-500";
  return "bg-red-500";
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 25) return "Average";
  return "Below Avg";
}

export default function StatBar({ label, value, score, weight, description }: StatBarProps) {
  const color = scoreColor(score);
  const tag = scoreLabel(score);

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-semibold text-white text-sm">{label}</span>
          <span className="ml-2 text-gray-500 text-xs">({Math.round(weight * 100)}% weight)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-mono font-bold">{value}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              score >= 75
                ? "bg-green-900 text-green-300"
                : score >= 50
                ? "bg-yellow-900 text-yellow-300"
                : score >= 25
                ? "bg-orange-900 text-orange-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {tag}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-gray-800">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500">{description}</p>
    </div>
  );
}
