# Dota 2 Rank Predictor

Predict your true Dota 2 rank based on real performance stats pulled from OpenDota API — GPM, KDA, last hits, ward score, healing, and more.

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `STEAM_API_KEY` | Get from [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey) |
| `SESSION_SECRET` | Random 32+ char string — run `openssl rand -base64 32` |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` locally, your Vercel URL in production |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the three environment variables in the Vercel dashboard
4. Update `NEXT_PUBLIC_BASE_URL` to your `https://your-app.vercel.app` URL
5. Deploy

> **Important:** After deploying, update `NEXT_PUBLIC_BASE_URL` to your production URL and redeploy.

## Requirements

- Players must have their **OpenDota profile set to public**
- OpenDota may take up to 24 hours to index new matches

## How It Works

1. User logs in via **Steam OpenID** (no password stored — Steam handles auth)
2. We fetch the player's recent match data from the **OpenDota API**
3. A rule-based algorithm scores each stat (GPM, XPM, KDA, last hits, wards, healing, tower damage, win rate) against known rank benchmarks
4. The weighted score is mapped to an estimated MMR and Dota rank bracket

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com)
- [iron-session](https://github.com/vvo/iron-session) (encrypted cookie sessions)
- [OpenDota API](https://docs.opendota.com)
- Steam OpenID 2.0
