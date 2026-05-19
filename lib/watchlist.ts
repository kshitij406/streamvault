import { WatchlistItem } from '@/types';
import { getCookieJson, setCookieJson } from './cookies';

const COOKIE = 'sv_wl';
const MAX = 20;

export function getWatchlist(): WatchlistItem[] {
  return getCookieJson<WatchlistItem[]>(COOKIE, []);
}

export function isInWatchlist(id: number, mediaType: 'movie' | 'tv'): boolean {
  return getWatchlist().some((i) => i.id === id && i.mediaType === mediaType);
}

export function toggleWatchlist(item: WatchlistItem): boolean {
  const list = getWatchlist();
  const idx = list.findIndex((i) => i.id === item.id && i.mediaType === item.mediaType);
  if (idx >= 0) {
    list.splice(idx, 1);
    setCookieJson(COOKIE, list);
    return false;
  }
  list.unshift({ ...item, addedAt: Date.now() });
  if (list.length > MAX) list.splice(MAX);
  setCookieJson(COOKIE, list);
  return true;
}
