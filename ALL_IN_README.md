# All In — Coaching Platform

Adaptive programming + biometric intelligence platform (Track A scaffold).

## What's in this repo

| Path | Purpose |
|------|---------|
| `src/` | Existing Vite web prototype (personal fat-loss tracker, localStorage) |
| `mobile/` | **Track A** Expo app — auth, invites, programs, workout logging, exercise library |
| `supabase/` | Postgres schema, migrations, exercise seed (873 exercises from free-exercise-db) |
| `api/` | Vercel serverless proxy for Claude API (web app) |

## Track A (Days 1–3) — Mobile scaffold

Built per the coaching app spec:

- Supabase auth with coach/client roles
- Coach-gated client invites (no open signup)
- In-app liability disclaimer onboarding
- Program session display
- Workout logging with bounded auto-progression suggestions
- Exercise library seeded from [free-exercise-db](https://github.com/yuhonas/free-exercise-db)

## Quick start — Mobile

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy the project URL and anon key

### 2. Apply database schema

In the Supabase SQL editor, run:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/seed.sql` (873 exercises)

### 3. Configure Expo env

```bash
cp mobile/.env.example mobile/.env
# Edit mobile/.env with your Supabase URL and anon key
```

### 4. Run the app

```bash
cd mobile
npm install
npm run web    # or npm run ios / npm run android with Expo Go
```

### 5. First-use flow

1. **Coach**: Sign up at `/(auth)/signup` → complete onboarding → open **Roster** tab → send client invite
2. **Client**: Open invite link `allin://invite/<token>` → create account → complete onboarding
3. Coach assigns a program in Supabase (demo SQL below) → client sees session on **Train** tab

## Demo program (optional)

Run in Supabase SQL after creating a coach account (replace `COACH_UUID`):

```sql
-- See supabase/seed-demo-program.sql
```

## Next up (Track A Days 4–7)

- Screenshot nutrition logging (Claude vision)
- Habit tracking tied to diagnosis engine
- Direct coach↔client chat (Supabase realtime)
- TestFlight build via EAS

## Stack

- **Mobile**: Expo 57 + React Native + TypeScript + Expo Router
- **Backend**: Supabase (Postgres, Auth, RLS, Storage)
- **Web prototype**: Vite + React + Tailwind (existing)
- **AI**: Claude API (Track B: AI coach layer)
