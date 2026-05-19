import { getCookieJson, setCookieJson } from './cookies';

const RATINGS_COOKIE = 'sv_r';
const WATCHED_COOKIE = 'sv_w';
const MAX_WATCHED = 150;

function key(mediaType: 'movie' | 'tv', id: number) {
  return `${mediaType[0]}_${id}`;
}

export function getRating(mediaType: 'movie' | 'tv', id: number): number | null {
  const map = getCookieJson<Record<string, number>>(RATINGS_COOKIE, {});
  return map[key(mediaType, id)] ?? null;
}

export function setRating(mediaType: 'movie' | 'tv', id: number, rating: number): void {
  const map = getCookieJson<Record<string, number>>(RATINGS_COOKIE, {});
  map[key(mediaType, id)] = rating;
  setCookieJson(RATINGS_COOKIE, map);
}

export function removeRating(mediaType: 'movie' | 'tv', id: number): void {
  const map = getCookieJson<Record<string, number>>(RATINGS_COOKIE, {});
  delete map[key(mediaType, id)];
  setCookieJson(RATINGS_COOKIE, map);
}

export function isWatched(mediaType: 'movie' | 'tv', id: number): boolean {
  return getCookieJson<string[]>(WATCHED_COOKIE, []).includes(key(mediaType, id));
}

export function toggleWatched(mediaType: 'movie' | 'tv', id: number): boolean {
  const k = key(mediaType, id);
  const list = getCookieJson<string[]>(WATCHED_COOKIE, []);
  const idx = list.indexOf(k);
  if (idx >= 0) {
    list.splice(idx, 1);
    setCookieJson(WATCHED_COOKIE, list);
    return false;
  }
  list.unshift(k);
  if (list.length > MAX_WATCHED) list.splice(MAX_WATCHED);
  setCookieJson(WATCHED_COOKIE, list);
  return true;
}

export function getAllRatings(): Array<{ mediaType: 'movie' | 'tv'; id: number; rating: number }> {
  const map = getCookieJson<Record<string, number>>(RATINGS_COOKIE, {});
  return Object.entries(map).map(([k, rating]) => {
    const [prefix, id] = k.split('_');
    return {
      mediaType: prefix === 'm' ? ('movie' as const) : ('tv' as const),
      id: Number(id),
      rating,
    };
  });
}
