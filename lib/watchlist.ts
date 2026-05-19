import { WatchlistItem } from '@/types';

const KEY = 'watchlist';

export function getWatchlist(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isInWatchlist(id: number, mediaType: 'movie' | 'tv'): boolean {
  return getWatchlist().some((i) => i.id === id && i.mediaType === mediaType);
}

export function toggleWatchlist(item: WatchlistItem): boolean {
  const list = getWatchlist();
  const exists = list.findIndex(
    (i) => i.id === item.id && i.mediaType === item.mediaType
  );
  if (exists >= 0) {
    list.splice(exists, 1);
    localStorage.setItem(KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...item, addedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list));
  return true;
}
