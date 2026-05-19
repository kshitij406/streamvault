import { getCookieJson, setCookieJson } from './cookies';

// Compact keys to stay within 4KB cookie limit
interface HistoryCompact {
  i: number;
  m: 'movie' | 'tv';
  t: string;
  pp: string | null;
  y: string;
  p: number;       // progress 0-100
  ct: number;      // currentTime
  d: number;       // duration
  lw: number;      // lastWatched timestamp
  g?: number[];    // genreIds
  s?: number;      // season
  e?: number;      // episode
}

export interface HistoryEntry {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year: string;
  progress: number;
  currentTime: number;
  duration: number;
  lastWatched: number;
  genreIds?: number[];
  season?: number;
  episode?: number;
}

const COOKIE = 'sv_h';
const MAX = 10;

function pack(e: HistoryEntry): HistoryCompact {
  const c: HistoryCompact = {
    i: e.id, m: e.mediaType, t: e.title, pp: e.posterPath,
    y: e.year, p: Math.round(e.progress * 10) / 10,
    ct: Math.round(e.currentTime), d: Math.round(e.duration),
    lw: e.lastWatched,
  };
  if (e.genreIds?.length) c.g = e.genreIds;
  if (e.season != null) c.s = e.season;
  if (e.episode != null) c.e = e.episode;
  return c;
}

function unpack(c: HistoryCompact): HistoryEntry {
  return {
    id: c.i, mediaType: c.m, title: c.t, posterPath: c.pp,
    year: c.y, progress: c.p, currentTime: c.ct, duration: c.d,
    lastWatched: c.lw, genreIds: c.g, season: c.s, episode: c.e,
  };
}

export function getHistory(): HistoryEntry[] {
  return getCookieJson<HistoryCompact[]>(COOKIE, []).map(unpack);
}

export function addToHistory(entry: Omit<HistoryEntry, 'lastWatched'>): void {
  const raw = getCookieJson<HistoryCompact[]>(COOKIE, []).filter(
    (c) => !(c.i === entry.id && c.m === entry.mediaType)
  );
  raw.unshift(pack({ ...entry, lastWatched: Date.now() }));
  if (raw.length > MAX) raw.splice(MAX);
  setCookieJson(COOKIE, raw);
}

export function getTopGenres(): number[] {
  const freq: Record<number, number> = {};
  for (const c of getCookieJson<HistoryCompact[]>(COOKIE, [])) {
    for (const g of c.g ?? []) freq[g] = (freq[g] ?? 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([id]) => Number(id));
}
