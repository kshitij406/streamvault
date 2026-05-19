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
| Video | Vidking embed player (`postMessage` for progress events) |
| Auth | next-auth@4, credentials provider, JWT sessions, bcryptjs |
| Storage | Cookies only (no localStorage — required for Smart TV browsers) |

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
OMDB_API_KEY=                       # Optional — free key at omdbapi.com for IMDB+RT ratings
```

### Vercel env vars (all configured ✓)
- `NEXTAUTH_SECRET` ✓
- `NEXTAUTH_URL` = `https://streamvault-woad.vercel.app` ✓
- `OMDB_API_KEY` ✓ — IMDB + RT badges active
- `USERS_DATA` ✓

> Auth has a **fallback secret** in `lib/auth.ts` as a safety net, but the real secret is now set.

---

## Cookie storage schema

All user data is cookie-based (no localStorage). Keys:

| Cookie | Contents | Max items |
|---|---|---|
| `sv_h` | Watch history (compact JSON, abbreviated keys) | 10 |
| `sv_wl` | Watchlist items | 20 |
| `sv_p` | Playback progress | 15 |
| `sv_r` | Personal ratings map `{ "m_123": 4.5 }` | 150 entries |
| `sv_w` | Watched keys `["m_123", "tv_456"]` | 150 entries |

History compact format keys: `i`=id, `m`=mediaType, `t`=title, `pp`=posterPath, `y`=year, `p`=progress, `ct`=currentTime, `d`=duration, `lw`=lastWatched, `g`=genreIds, `s`=season, `e`=episode.

Server components can read history via `cookies().get('sv_h')?.value` → `decodeURIComponent` → `JSON.parse`.

---

## Routes

```
/                     Homepage — trending rows, Continue Watching, Recommended For You
/movies               5 rows: trending, popular, top rated, now playing, upcoming
/tv-shows             4 rows: trending, popular, top rated, on the air
/movie/[id]           Movie detail — player, ratings badges, cast, star rating, watched button
/tv/[id]              TV show detail — episode list, cast, star rating, watched button
/tv/[id]/[s]/[e]      Episode player
/search               Full-text search (TMDB /search/multi)
/watchlist            Saved items grid
/diary                Letterboxd-style diary — watch history with personal ratings
/login                Credentials sign-in (optional — main site never redirects here)
/signup               Account creation
```

---

## Key files

### `lib/`
- `cookies.ts` — `getCookie`, `setCookie`, `getCookieJson`, `setCookieJson`
- `history.ts` — `getHistory()`, `addToHistory()`, `getTopGenres()`
- `ratings.ts` — `getRating/setRating/removeRating`, `isWatched/toggleWatched`, `getAllRatings()`
- `watchlist.ts` — `getWatchlist()`, `isInWatchlist()`, `toggleWatchlist()`
- `progress.ts` — `getProgress()`, `saveProgress()`, `formatTime()`
- `tmdb.ts` — all TMDB fetches including `getDiscoverMovies(genreIds)`, `getDiscoverTV(genreIds)`, `getMovieExternalIds(id)`, `getTVExternalIds(id)`
- `omdb.ts` — `getExternalRatings(imdbId)` → `{ imdb, rottenTomatoes }` (server-side only, needs `OMDB_API_KEY`)
- `auth.ts` — NextAuth config, fallback secret
- `users.ts` — file-based users, reads `USERS_DATA` env var on Vercel

### `components/`
- `Player.tsx` — iframe embed, writes progress + history on `timeupdate`/`pause`/`ended`. Props: `mediaType`, `id`, `season?`, `episode?`, `title?`, `posterPath?`, `year?`, `genreIds?`
- `ContinueWatching.tsx` — client component, reads `sv_h`, shows items with 2%–95% progress
- `StarRating.tsx` — half-star input (0.5–5), reads/writes `sv_r`
- `WatchedButton.tsx` — toggle, reads/writes `sv_w`
- `MediaRow.tsx` — horizontal scroll row with D-pad arrow-key navigation (TV)
- `MediaCard.tsx` — poster card with overlay on hover/focus
- `TVModeDetector.tsx` — detects Smart TV by UA + screen heuristics, adds `tv-mode` class to `<html>`
- `SessionProvider.tsx` — wraps NextAuth SessionProvider in an error boundary (TV resilience)
- `Navbar.tsx` — desktop nav with Diary link; mobile hamburger
- `BottomNav.tsx` — mobile bottom nav: Home / Movies / TV / Diary / Saved

### `app/page.tsx`
Server component. Reads `sv_h` cookie server-side to extract top genre IDs, then fetches `getDiscoverMovies(topGenres)` in parallel with trending/popular rows.

### `app/diary/page.tsx`
Client component. Reads history + ratings + watched status from cookies on mount. Shows timeline of watched content with personal star ratings.

### `app/globals.css`
TV-mode CSS (`tv-mode` class): bigger cards (200px), always-visible focus ring, larger text, focus-within card overlays. Focus ring: `outline: 4px solid #e50914`.

---

## Auth notes

- Auth is **completely optional** — `middleware.ts` is a passthrough, homepage never redirects
- Users stored in `data/users.json` (local) or `USERS_DATA` env var (Vercel)
- `lib/users.ts` reads `process.env.USERS_DATA` first, falls back to `data/users.json`
- To add a production user: hash password with bcryptjs, add to `USERS_DATA` JSON on Vercel

---

## TV browser support

- No localStorage anywhere — all storage is cookies
- `TVModeDetector.tsx` applies `tv-mode` class for 10-foot UI scaling
- `MediaRow.tsx` has ArrowLeft/ArrowRight D-pad navigation between cards
- `MediaCard.tsx` uses `tabIndex={0}` + `group-focus` Tailwind classes for keyboard overlays
- `SessionProvider.tsx` has error boundary — if NextAuth crashes on TV, site still renders

---

## Known issues / possible next steps

- **IMDB/RT badges** only show if `OMDB_API_KEY` is set (free tier: 1000 req/day). Without it, only the TMDB and Letterboxd-link badges appear.
- **Letterboxd rating** is a link (no public API exists for community ratings). Shows search URL on letterboxd.com.
- **USERS_DATA on Vercel** — signup creates users in `data/users.json` (not persisted on Vercel serverless). For production: collect signups locally, then update `USERS_DATA` env var as a JSON string.
- **Cookie size**: sv_h capped at 10 entries, sv_wl at 20, sv_p at 15 — all well under 4KB.
- **No search in BottomNav** — moved search to hamburger menu on mobile (kept 5 tabs: Home/Movies/TV/Diary/Saved).

---

## Running locally

```bash
npm run dev      # http://localhost:3000
npm run build    # verify no ESLint/TypeScript errors before pushing
git push origin main  # triggers Vercel deploy automatically
```
