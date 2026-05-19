import { ProgressData } from '@/types';
import { getCookieJson, setCookieJson } from './cookies';

const COOKIE = 'sv_p';
const MAX = 15;

interface ProgressEntry extends ProgressData {
  key: string;
}

export function progressKey(mediaType: 'movie' | 'tv', id: number): string {
  return `${mediaType[0]}_${id}`;
}

export function getProgress(mediaType: 'movie' | 'tv', id: number): ProgressData | null {
  const entries = getCookieJson<ProgressEntry[]>(COOKIE, []);
  const entry = entries.find((e) => e.key === progressKey(mediaType, id));
  if (!entry) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { key: _k, ...data } = entry;
  return data;
}

export function saveProgress(
  mediaType: 'movie' | 'tv',
  id: number,
  data: Omit<ProgressData, 'updatedAt'>
): void {
  const k = progressKey(mediaType, id);
  const entries = getCookieJson<ProgressEntry[]>(COOKIE, []).filter((e) => e.key !== k);
  entries.unshift({ key: k, ...data, updatedAt: Date.now() });
  if (entries.length > MAX) entries.splice(MAX);
  setCookieJson(COOKIE, entries);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
