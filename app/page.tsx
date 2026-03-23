import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session.steamId) redirect("/dashboard");

  const { error } = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <main className="relative flex flex-col flex-1 items-center justify-center px-6 text-center">
        {/* Logo / Icon area */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 shadow-2xl shadow-red-900/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Dota 2{" "}
          <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Rank Predictor
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-gray-400 leading-relaxed">
          Connect your Steam account and we&apos;ll analyze your actual in-game performance —
          GPM, KDA, last hits, vision control, and more — to predict your true skill bracket.
        </p>

        {/* Stat pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {["KDA", "GPM", "XPM", "Last Hits", "Hero Damage", "Ward Score", "Win Rate", "Healing"].map(
            (stat) => (
              <span
                key={stat}
                className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300 border border-gray-700"
              >
                {stat}
              </span>
            )
          )}
        </div>

        {/* Error message */}
        {error === "auth_failed" && (
          <div className="mt-6 rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
            Steam authentication failed. Please try again.
          </div>
        )}

        {/* Steam Login Button */}
        <a
          href="/api/auth/steam"
          className="mt-10 inline-flex items-center gap-3 rounded-xl bg-[#1b2838] hover:bg-[#2a475e] border border-[#4b7194] px-8 py-4 text-lg font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-blue-900/40 hover:scale-105"
        >
          <SteamIcon />
          Sign in with Steam
        </a>

        <p className="mt-4 text-xs text-gray-600">
          We only read your public match data. Your profile must be set to public on OpenDota.
        </p>

        {/* How it works */}
        <div className="mt-20 grid max-w-3xl grid-cols-1 gap-6 text-left sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Login with Steam",
              desc: "Authenticate securely via Steam's official OpenID. We never store your password.",
            },
            {
              step: "02",
              title: "We Analyze Your Stats",
              desc: "We pull your recent match data from OpenDota — GPM, KDA, last hits, vision, and more.",
            },
            {
              step: "03",
              title: "Get Your True Rank",
              desc: "Our algorithm compares your stats against rank benchmarks to predict your skill bracket.",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="rounded-xl bg-gray-900 border border-gray-800 p-6"
            >
              <div className="mb-3 text-3xl font-bold text-gray-700">{step}</div>
              <h3 className="mb-2 font-semibold text-white">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative py-6 text-center text-xs text-gray-700">
        Powered by{" "}
        <a
          href="https://www.opendota.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-gray-400"
        >
          OpenDota API
        </a>{" "}
        &amp; Steam OpenID
      </footer>
    </div>
  );
}

function SteamIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-6 w-6 fill-white"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.082-.729.082-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.997.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 013.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.62-5.48 5.92.43.37.814 1.1.814 2.22 0 1.606-.015 2.9-.015 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
