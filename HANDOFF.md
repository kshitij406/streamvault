# StreamVault — Handoff

Personal streaming site built on Next.js 14 App Router, Tailwind, TypeScript.
GitHub: `https://github.com/kshitij406/streamvault`
Vercel: `https://streamvault-woad.vercel.app`

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS (`bg-background` = `#0a0a0a`, accent = `#e50914`) |
| Data | TMDB API (bearer token, all keys `NEXT_PUBLIC_`) |
| Video | Iframe embeds — Vidking, VidSrc, EmbedSu. Manual server switcher below player. |
| Auth | next-auth@4, credentials provider, JWT sessions, bcryptjs |
| DB | Neon PostgreSQL (`@neondatabase/serverless`, HTTP transport) — for logged-in users |
| Local storage | `localStorage` key `sv_history` — watch history for all users (no login needed) |
| Subtitles | OpenSubtitles API — fetched server-side, overlaid on player. Offset control ±0.5s. |

---

## Environment variables

### `.env.local` (local dev)
```
NEXT_PUBLIC_TMDB_API_KEY=...
NEXT_PUBLIC_TMDB_TOKEN=...          # Bearer token — used for all TMDB fetches
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_IMAGE_BASE=https://image.tmdb.org/t/p/
NEXT_PUBLIC_VIDKING_BASE=https://www.vidking.net/embed
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=...                    # Neon connection string
OPENSUBTITLES_API_KEY=...           # Optional — free key at opensubtitles.com
OMDB_API_KEY=...                    # Optional — free key at omdbapi.com
```

### Vercel env vars (all configured ✓)
- `NEXTAUTH_SECRET` ✓
- `NEXTAUTH_URL` = `https://streamvault-woad.vercel.app` ✓
- `DATABASE_URL` ✓ — Neon Postgres
- `OPENSUBTITLES_API_KEY` ✓
- `OMDB_API_KEY` ✓

---

## Storage architecture

Two-layer approach so features work for everyone, not just logged-in users.

### Layer 1 — localStorage (all users)
Key: `sv_history` (managed by `lib/localHistory.ts`)

Each entry: `{ mediaId, mediaType, title, posterPath, progress, currentTime, duration, season, episode, genreIds, lastWatched }`

- Capped at 50 items, sorted newest-first
- Written by `Player.tsx` via `upsertLocalHistory()`:
  - **With postMessages**: saves every 5 seconds with real `currentTime` and `progress`
  - **Without postMessages** (Vidking stopped sending events in some regions): 30-second time-based fallback saves `progress: 5%` so item shows in Continue Watching regardless
- Read by `ContinueWatching.tsx` (filter: 2% ≤ progress ≤ 95%) and `BecauseYouWatched.tsx`

### Layer 2 — Neon DB (logged-in users only)
Tables: `users`, `watch_history`, `watchlist`, `user_ratings`

DB is written by the API routes whenever a valid session exists. Reading from DB supplements localStorage with cross-device history.

**IMPORTANT**: DB tables must be created once after first deploy by visiting `/api/admin/init-db`. Returns `{ ok: true }` when all tables exist.

---

## Neon DB schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watch_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL, media_type TEXT NOT NULL,
  title TEXT NOT NULL, poster_path TEXT,
  year TEXT DEFAULT '', genre_ids INTEGER[] DEFAULT '{}',
  season INTEGER, episode INTEGER,
  current_time REAL DEFAULT 0, duration REAL DEFAULT 0, progress REAL DEFAULT 0,
  last_watched TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL, media_type TEXT NOT NULL,
  title TEXT NOT NULL, poster_path TEXT,
  year TEXT DEFAULT '', rating REAL DEFAULT 0, genre_ids INTEGER[] DEFAULT '{}',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_id, media_type)
);

CREATE TABLE user_ratings (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL, media_type TEXT NOT NULL,
  rating REAL, watched BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, media_id, media_type)
);
```

---

## Routes

```
/                     Homepage — trending rows, Continue Watching (localStorage), Because You Watched
/movies               5 rows: trending, popular, top rated, now playing, upcoming
/tv-shows             4 rows: trending, popular, top rated, on the air
/movie/[id]           Movie detail — player, ratings badges, cast, star rating, watched button
/tv/[id]              TV show detail — episode list, cast, star rating, watched button
/tv/[id]/[s]/[e]      Episode player
/search               Full-text search (TMDB /search/multi)
/watchlist            Saved items grid (DB for logged-in users)
/diary                Watch history with personal ratings (DB for logged-in users)
/login                Credentials sign-in (optional — main site never redirects here)
/signup               Account creation
/api/admin/init-db    One-time DB table creation — visit once after fresh deploy
/api/health           Health check — DB + TMDB. Runs daily via Vercel cron.
```

---

## API routes

| Route | Auth required | Description |
|---|---|---|
| `GET /api/history` | Yes | Returns watch history. `?in_progress=true` filters 2–95% progress |
| `POST /api/history` | Yes | Upserts a watch history entry |
| `GET /api/watchlist` | Yes | `?mediaId&mediaType` → `{ saved }` or all items |
| `POST /api/watchlist` | Yes | Toggle item in/out of watchlist |
| `DELETE /api/watchlist` | Yes | Remove specific item |
| `GET /api/ratings` | Yes | `?mediaId&mediaType` → `{ rating, watched }` or all |
| `POST /api/ratings` | Yes | Upsert rating/watched |
| `DELETE /api/ratings` | Yes | Remove rating |
| `GET /api/subtitles` | No | Fetch OpenSubtitles for `?type&id[&season&episode]` |
| `GET /api/health` | No | DB + TMDB health check |
| `GET /api/admin/init-db` | No | Create DB tables (idempotent, run once) |

---

## Key files

### `lib/`
- `localHistory.ts` — `upsertLocalHistory()`, `getLocalHistory()`, `getLocalInProgress()` — localStorage r/w
- `db.ts` — `export const sql = neon(process.env.DATABASE_URL!)` — tagged template literal
- `users.ts` — `getUserByEmail()`, `addUser()` — DB-backed, used by NextAuth
- `auth.ts` — NextAuth config, credentials provider
- `tmdb.ts` — all TMDB fetches
- `omdb.ts` — `getExternalRatings(imdbId)` → IMDB + RT ratings (server-side, needs `OMDB_API_KEY`)
- `opensubtitles.ts` — subtitle fetch + VTT parse → `SubCue[]`
- `servers.ts` — `SERVERS` array, `buildServerUrl(serverId, type, id, season?, episode?)`

### `components/`
- `Player.tsx` — iframe embed with manual server switcher. Saves to localStorage after every 5s postMessage OR after 30s fallback. Subtitle overlay driven by postMessage `currentTime`. No auto-switch/no-signal overlay (removed — Vidking stopped sending events reliably).
- `ContinueWatching.tsx` — reads localStorage immediately; also fetches `/api/history` for logged-in users and merges
- `BecauseYouWatched.tsx` — reads localStorage last-watched, calls TMDB recs client-side (NEXT_PUBLIC token)
- `WatchlistButton.tsx` — `useSession()`, GET/POST `/api/watchlist`
- `WatchedButton.tsx` — `useSession()`, GET/POST `/api/ratings`
- `StarRating.tsx` — `useSession()`, GET/POST/DELETE `/api/ratings`
- `MediaRow.tsx` — horizontal scroll row with D-pad arrow-key navigation (TV)
- `MediaCard.tsx` — poster card with hover/focus overlay
- `TVModeDetector.tsx` — detects Smart TV by UA + screen heuristics, adds `tv-mode` class to `<html>`
- `SessionProvider.tsx` — NextAuth SessionProvider with error boundary (TV resilience)
- `Navbar.tsx` — desktop nav; `BottomNav.tsx` — mobile bottom tabs

### `app/page.tsx`
Server component. For logged-in users: queries DB for top genres → `getDiscoverMovies()` for "Recommended For You". For everyone: `ContinueWatching` + `BecauseYouWatched` work via localStorage client-side.

---

## Auth notes

- Auth is **completely optional** — `middleware.ts` is a passthrough, homepage never forces login
- Watchlist, ratings, diary, and cross-device history require login
- Continue Watching and Because You Watched work without login (localStorage)
- Users stored in Neon DB `users` table (bcrypt password hash)

---

## TV browser support

- `TVModeDetector.tsx` applies `tv-mode` class for 10-foot UI scaling
- `MediaRow.tsx` has ArrowLeft/ArrowRight D-pad navigation
- `MediaCard.tsx` uses `tabIndex={0}` + `group-focus` Tailwind classes
- `SessionProvider.tsx` has error boundary — if NextAuth crashes on TV, site still renders
- Note: localStorage is used for watch history; most Smart TV browsers support it. Cookie-based storage was removed when migrating to Neon.

---

## Player notes

Vidking (`vidking.net/embed`) is the default server. It sometimes sends `PLAYER_EVENT` postMessages with `{ event, currentTime, duration, progress }`, which are used for accurate subtitle sync and history saving. When these events don't arrive (varies by region/ad blocker), a 30-second page-time fallback saves the entry with `progress: 5%`.

The postMessage handler also accepts two other common embed formats:
- `{ type: 'timeupdate', currentTime, duration }`
- `{ event: 'timeupdate', currentTime, duration }`

VidSrc and EmbedSu don't send postMessages — the time-based fallback handles them.

---

## Vercel cron

`vercel.json` schedules `/api/health` daily at midnight UTC. This pings the Neon DB to prevent cold starts from becoming too severe (Neon free tier suspends after 5 min inactivity). Hobby plan is limited to daily crons.

---

## Known issues / possible next steps

- **Subtitle accuracy**: offset control (±0.5s) compensates for sync drift. Subtitles only active on Vidking server.
- **Neon cold start**: free tier can take 5–10s on first request of the day. The daily cron mitigates this but doesn't eliminate it.
- **OMDB badges**: only show if `OMDB_API_KEY` is set (free: 1000 req/day).
- **Letterboxd rating**: link only (no public API).
- **Signup persistence**: users go into Neon DB. If you reset the DB, all accounts are lost.
- **Native HLS player**: attempted but removed. All streaming sites generate video URLs via JavaScript — server-side scraping returns nothing without a headless browser. Iframes remain the only viable approach without separate scraping infrastructure.

---

## Running locally

```bash
npm run dev      # http://localhost:3000
npm run build    # verify no ESLint/TypeScript errors before pushing
git push origin main  # triggers Vercel auto-deploy
# or: vercel --prod --yes  (force deploy, bypasses GitHub if auto-deploy is stale)
```
