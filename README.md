# Gym Tracker

Log workouts and track strength progress.

| Folder    | Stack                                                         |
|-----------|---------------------------------------------------------------|
| `client/` | Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, shadcn/ui, Lucide |
| `server/` | Express 5, TypeScript, Mongoose (MongoDB), Zod                |

## Architecture

```
Browser ──▶ Next.js (server components + server actions) ──▶ Express API ──▶ MongoDB
```

- **The browser never calls Express directly.** Pages are Server Components that
  fetch on the server; mutations go through Server Actions. `API_URL` is server-only.
- **Client Components are used only when needed** (inline form errors, confirm
  dialogs, active nav link). Everything else renders on the server.
- **Filters live in the URL** (`/exercises?muscleGroup=chest&q=press`), so they're
  server-rendered, shareable, and work without JavaScript.
- **Express is the single source of validation** (Zod) and of the exercise
  classification values (`GET /api/exercises/options`).

## API client (client/src/lib/api/)

All calls to Express go through one place:

- `client.ts`: `request()`, the single `fetch` (URL + query building, JSON, `ApiError`, curl logging)
- `endpoints.ts`: every endpoint defined once: `exercisesApi`, `workoutsApi`, `statsApi`
- `curl.ts`: turns a request into a copy-pasteable curl command

```ts
import { exercisesApi, ApiError } from "@/lib/api";
const chest = await exercisesApi.list({ muscleGroup: "chest" });
```

### Curl logging

In development, every API call is printed in the **Next.js terminal** as a curl
command you can copy and run:

```
[api] GET /api/stats/dashboard?today=2026-11-23&weeks=8 → 200 (20ms)
curl 'http://localhost:4000/api/stats/dashboard?today=2026-11-23&weeks=8' -H 'Accept: application/json'
```

- On by default in `next dev`, off in production. Override with `API_LOG_CURL=1` or `API_LOG_CURL=0`.
- `Authorization`, `Cookie` and `X-Api-Key` values are printed as `***`.
- Lines marked `cancelled (Next.js prerender finished)` are expected: Next prerenders
  pages speculatively and cancels fetches it no longer needs.

## Prerequisites

- Node.js 20+
- A MongoDB database: either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local install
  (`brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`)

## Run locally

```bash
# 1. API (http://localhost:4000)
cd server
cp .env.example .env      # set MONGODB_URI
npm install
npm run seed              # load the predefined exercise library (safe to re-run)
npm run dev

# 2. Web app (http://localhost:3000), in a second terminal
cd client
cp .env.example .env.local
npm install
npm run dev
```

Check the API: `curl http://localhost:4000/api/health` → `{"status":"ok","db":"connected"}`

## API

| Method | Path                       | Description                                   |
|--------|----------------------------|-----------------------------------------------|
| GET    | `/api/health`              | Server + database status                      |
| GET    | `/api/exercises`           | List; filters: `q`, `muscleGroup`, `equipment`, `category` |
| GET    | `/api/exercises/options`   | Allowed muscle groups / equipment / categories |
| GET    | `/api/exercises/:id`       | One exercise                                  |
| POST   | `/api/exercises`           | Add a custom exercise                         |
| DELETE | `/api/exercises/:id`       | Delete a custom exercise (blocked if used in a workout) |
| GET    | `/api/workouts`            | History, newest first; `from`, `to` (YYYY-MM-DD), `page`, `limit` |
| GET    | `/api/workouts/previous`   | Last sets per exercise: `exercises=id1,id2`, optional `excludeWorkout` |
| GET    | `/api/workouts/:id`        | One workout with exercise details and volume  |
| POST   | `/api/workouts`            | Create a workout                              |
| PUT    | `/api/workouts/:id`        | Replace a workout                             |
| DELETE | `/api/workouts/:id`        | Delete a workout                              |
| GET    | `/api/stats/dashboard`     | Totals, this/last week, weekly series, recent; `today` (YYYY-MM-DD), `weeks` (1–26) |

Workout `date` is a calendar day (`YYYY-MM-DD`), stored as midnight UTC and always
displayed in UTC, so the day never shifts across timezones. Weeks start on Monday.
The browser stores its timezone in a `tz` cookie so the server can compute the
user's local "today" for "this week" stats.
