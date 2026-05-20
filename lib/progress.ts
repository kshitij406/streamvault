import { ProgressData } from '@/types';
import { getCookieJson, setCookieJson } from './cookies';

type ServerId = NonNullable<ProgressData['serverId']>;

const COOKIE = 'sv_p';
const MAX = 15;

interface ProgressEntry extends ProgressData {
  key: string;
}

export function progressKey(
  mediaType: 'movie' | 'tv',
  id: number,
  serverId?: ServerId
): string {
  // Keep server in key so we can store per-server progress.
  // Legacy keys were just `${m/t}_${id}`.
  return serverId ? `${mediaType[0]}_${id}_${serverId}` : `${mediaType[0]}_${id}`;
}

export function getProgress(mediaType: 'movie' | 'tv', id: number): ProgressData | null {
  const entries = getCookieJson<ProgressEntry[]>(COOKIE, []);

  const prefix = `${mediaType[0]}_${id}`;
  const candidates = entries.filter((e) => e.key === prefix || e.key.startsWith(prefix + '_'));
  if (!candidates.length) return null;

  // Pick the server with the furthest progress (tie-breaker: newest).
  const best = candidates.reduce((acc, cur) => {
    if (!acc) return cur;
    if ((cur.progress ?? 0) > (acc.progress ?? 0)) return cur;
    if ((cur.progress ?? 0) < (acc.progress ?? 0)) return acc;
    return (cur.updatedAt ?? 0) >= (acc.updatedAt ?? 0) ? cur : acc;
  }, null as ProgressEntry | null);

  if (!best) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { key: _k, ...data } = best;

  // If the key encodes serverId, surface it even if older data didn't store it.
  if (!data.serverId) {
    const parts = best.key.split('_');
    const maybe = parts[2];
    if (maybe === 'vidking' || maybe === 'vidsrc' || maybe === 'embedsu') {
      (data as ProgressData).serverId = maybe;
    }
  }

  return data;
}

export function saveProgress(
  mediaType: 'movie' | 'tv',
  id: number,
  data: Omit<ProgressData, 'updatedAt'>,
  serverId?: ServerId
): void {
  const k = progressKey(mediaType, id, serverId ?? data.serverId);
  const entries = getCookieJson<ProgressEntry[]>(COOKIE, []).filter((e) => e.key !== k);
  entries.unshift({ key: k, ...data, serverId: serverId ?? data.serverId, updatedAt: Date.now() });
  if (entries.length > MAX) entries.splice(MAX);
  setCookieJson(COOKIE, entries);
}

export function removeProgress(mediaType: 'movie' | 'tv', id: number): void {
  const entries = getCookieJson<ProgressEntry[]>(COOKIE, []);
  const prefix = `${mediaType[0]}_${id}`;
  const next = entries.filter((e) => !(e.key === prefix || e.key.startsWith(prefix + '_')));
  setCookieJson(COOKIE, next);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
