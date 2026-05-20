const KEY = 'sv_history';
const MAX = 50;

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
  const list = read().filter(
    (h) =>
      !(
        h.mediaId === entry.mediaId &&
        h.mediaType === entry.mediaType &&
        h.season === entry.season &&
        h.episode === entry.episode &&
        (h.serverId ?? null) === (entry.serverId ?? null)
      ),
  );
  write([{ ...entry, lastWatched: Date.now() }, ...list]);
}

export function getLocalInProgress(): LocalEntry[] {
  return read().filter((h) => h.progress >= 2 && h.progress <= 95);
}

export function getLocalHistory(): LocalEntry[] {
  return read();
}
