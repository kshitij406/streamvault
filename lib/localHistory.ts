const KEY = 'sv_history';
const MAX = 50;

function clampProgress(p: number) {
  if (!Number.isFinite(p)) return 0;
  return Math.max(0, Math.min(100, p));
}

function toNum(n: unknown, fallback = 0) {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

export interface LocalEntry {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  progress: number;
  currentTime: number;
  duration: number;
  season: number | null;
  episode: number | null;
  genreIds: number[];
  // Embed server that was used when this entry was saved.
  serverId?: 'vidking' | 'vidsrc' | 'embedsu';
  lastWatched: number; // ms timestamp
}

function read(): LocalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function write(list: LocalEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {}
}

export function upsertLocalHistory(entry: Omit<LocalEntry, 'lastWatched'>) {
  const normalized: Omit<LocalEntry, 'lastWatched'> = {
    ...entry,
    progress: clampProgress(toNum(entry.progress)),
    currentTime: Math.max(0, toNum(entry.currentTime)),
    duration: Math.max(0, toNum(entry.duration)),
  };

  const existing = read().find(
    (h) =>
      h.mediaId === normalized.mediaId &&
      h.mediaType === normalized.mediaType &&
      h.season === normalized.season &&
      h.episode === normalized.episode &&
      (h.serverId ?? null) === (normalized.serverId ?? null),
  );

  // Don’t overwrite a known duration with 0 (fallback saves).
  if ((normalized.duration ?? 0) <= 0 && (existing?.duration ?? 0) > 0) {
    normalized.duration = existing!.duration;
    // Improve precision: derive progress from currentTime when we can.
    if ((normalized.currentTime ?? 0) > 0) {
      normalized.progress = clampProgress((normalized.currentTime / normalized.duration) * 100);
    }
  }

  const list = read().filter(
    (h) =>
      !(
        h.mediaId === normalized.mediaId &&
        h.mediaType === normalized.mediaType &&
        h.season === normalized.season &&
        h.episode === normalized.episode &&
        (h.serverId ?? null) === (normalized.serverId ?? null)
      ),
  );
  write([{ ...normalized, lastWatched: Date.now() }, ...list]);
}

export function getLocalInProgress(): LocalEntry[] {
  return read().filter((h) => h.progress >= 2 && h.progress <= 95);
}

export function getLocalHistory(): LocalEntry[] {
  return read();
}

export function removeLocalHistoryBase({
  mediaId,
  mediaType,
  season,
  episode,
}: {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
}) {
  const s = season ?? null;
  const e = episode ?? null;

  const next = read().filter(
    (h) =>
      !(h.mediaId === mediaId && h.mediaType === mediaType && h.season === s && h.episode === e),
  );
  write(next);
}
