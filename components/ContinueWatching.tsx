'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, X } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb';
import { getLocalInProgress, removeLocalHistoryBase, type LocalEntry } from '@/lib/localHistory';
import { getHistory, removeFromHistory } from '@/lib/history';
import { removeProgress } from '@/lib/progress';

interface DisplayEntry {
  key: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  progress: number;
  currentTime?: number;
  duration?: number;
  season?: number;
  episode?: number;
  lastWatched?: number;
}

function fromLocal(h: LocalEntry): DisplayEntry {
  return {
    key: `${h.mediaType}-${h.mediaId}-${h.season}-${h.episode}-${h.serverId ?? 'unknown'}`,
    mediaId: h.mediaId,
    mediaType: h.mediaType,
    title: h.title,
    posterPath: h.posterPath,
    progress: h.progress,
    currentTime: h.currentTime,
    duration: h.duration,
    season: h.season ?? undefined,
    episode: h.episode ?? undefined,
    lastWatched: h.lastWatched,
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

function formatTimeLeft(duration: number, progress: number): string {
  if (duration > 0) {
    const secsLeft = duration * (1 - progress / 100);
    if (secsLeft > 0) {
      const mins = Math.round(secsLeft / 60);
      if (mins < 60) return `${mins}m left`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
    }
  }
  return `${Math.round(progress)}% watched`;
}

function baseKey(e: Pick<DisplayEntry, 'mediaType' | 'mediaId' | 'season' | 'episode'>) {
  return `${e.mediaType}-${e.mediaId}-${e.season ?? null}-${e.episode ?? null}`;
}

function removeBaseKeySetKey(e: Pick<DisplayEntry, 'mediaType' | 'mediaId' | 'season' | 'episode'>) {
  return baseKey(e);
}

function upsertBest(
  map: Map<string, DisplayEntry>,
  entry: DisplayEntry
) {
  const k = baseKey(entry);
  const prev = map.get(k);
  if (!prev) {
    map.set(k, entry);
    return;
  }

  // Prefer whichever server is further along. When duration is unknown (common
  // for embeds without postMessages), fall back to currentTime.
  const durPrev = prev.duration ?? 0;
  const durNext = entry.duration ?? 0;
  const ctPrev = prev.currentTime ?? 0;
  const ctNext = entry.currentTime ?? 0;

  const comparableByProgress = durPrev > 0 && durNext > 0;
  if (comparableByProgress) {
    const pPrev = clamp(prev.progress);
    const pNext = clamp(entry.progress);
    if (pNext > pPrev) {
      map.set(k, entry);
      return;
    }
    if (pNext < pPrev) return;
  } else {
    if (ctNext > ctPrev) {
      map.set(k, entry);
      return;
    }
    if (ctNext < ctPrev) return;
  }

  // tie-breaker: newest
  if ((entry.lastWatched ?? 0) >= (prev.lastWatched ?? 0)) map.set(k, entry);
}

export default function ContinueWatching() {
  return <ContinueWatchingBase />;
}

export function ContinueWatchingFiltered({
  mediaType,
  title,
}: {
  mediaType: 'movie' | 'tv';
  title?: string;
}) {
  return <ContinueWatchingBase mediaType={mediaType} title={title} />;
}

function ContinueWatchingBase({
  mediaType,
  title,
}: {
  mediaType?: 'movie' | 'tv';
  title?: string;
}) {
  const [items, setItems] = useState<DisplayEntry[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());

  // Persisted hide list: users can remove items from Continue Watching.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sv_cw_hidden');
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) setRemoved(new Set(parsed));
    } catch {
      // ignore
    }
  }, []);

  const removedKeyList = useMemo(() => Array.from(removed.values()), [removed]);

  useEffect(() => {
    // Read from localStorage immediately — works without login
    const local = getLocalInProgress().map(fromLocal);
    const map = new Map<string, DisplayEntry>();
    for (const h of local) upsertBest(map, h);

    // Cookie history fallback (some TV browsers restrict localStorage)
    try {
      for (const h of getHistory()) {
        const p = clamp(h.progress);
        if (p < 2 || p > 95) continue;
        const entry: DisplayEntry = {
          key: `${h.mediaType}-${h.id}-${h.season ?? null}-${h.episode ?? null}-cookie`,
          mediaId: h.id,
          mediaType: h.mediaType,
          title: h.title,
          posterPath: h.posterPath,
          progress: p,
          currentTime: h.currentTime,
          duration: h.duration,
          season: h.season,
          episode: h.episode,
          lastWatched: h.lastWatched,
        };
        upsertBest(map, entry);
      }
    } catch {
      // ignore cookie parse errors
    }

    if (map.size)
      setItems(
        Array.from(map.values())
          .filter((i) => (mediaType ? i.mediaType === mediaType : true))
          .filter((i) => !removed.has(removeBaseKeySetKey(i)))
          .sort(
          (a, b) => (b.lastWatched ?? 0) - (a.lastWatched ?? 0),
        ),
      );

    // Also try API (logged-in users get cross-device history merged in)
    fetch('/api/history?in_progress=true')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.history?.length) return;
        // Overlay API entries (may include other-device progress)
        for (const r of data.history as Record<string, unknown>[]) {
          const entry: DisplayEntry = {
            key: `${r.media_type}-${r.media_id}-${r.season ?? null}-${r.episode ?? null}-db`,
            mediaId: r.media_id as number,
            mediaType: r.media_type as 'movie' | 'tv',
            title: r.title as string,
            posterPath: (r.poster_path as string) ?? null,
            progress: clamp(r.progress as number),
            currentTime: (r.current_time as number | null) ?? undefined,
            duration: (r.duration as number | null) ?? undefined,
            season: (r.season as number | null) ?? undefined,
            episode: (r.episode as number | null) ?? undefined,
            lastWatched:
              typeof r.last_watched === 'string' || typeof r.last_watched === 'number'
                ? new Date(r.last_watched as string | number).getTime()
                : undefined,
          };
          upsertBest(map, entry);
        }
        setItems(
          Array.from(map.values())
            .filter((i) => (mediaType ? i.mediaType === mediaType : true))
            .filter((i) => !removed.has(removeBaseKeySetKey(i)))
            .sort((a, b) => (b.lastWatched ?? 0) - (a.lastWatched ?? 0)),
        );
      })
      .catch(() => {});
  }, [mediaType, removedKeyList]);

  const removeItem = async (item: DisplayEntry) => {
    const key = removeBaseKeySetKey(item);

    setItems((prev) => prev.filter((x) => removeBaseKeySetKey(x) !== key));
    setRemoved((prev) => {
      const next = new Set(prev);
      next.add(key);
      try {
        localStorage.setItem('sv_cw_hidden', JSON.stringify(Array.from(next.values()).slice(0, 200)));
      } catch {}
      return next;
    });

    // Best-effort: also purge from our local/cookie stores to keep future merges clean.
    try {
      removeLocalHistoryBase({
        mediaId: item.mediaId,
        mediaType: item.mediaType,
        season: item.season,
        episode: item.episode,
      });
    } catch {}
    try {
      removeFromHistory(item.mediaType, item.mediaId);
    } catch {}
    try {
      removeProgress(item.mediaType, item.mediaId);
    } catch {}

    // If logged in, also delete the matching DB history row.
    fetch('/api/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaId: item.mediaId,
        mediaType: item.mediaType,
        season: item.season ?? null,
        episode: item.episode ?? null,
      }),
    }).catch(() => {});
  };

  if (!items.length) return null;

  return (
    <section className="mb-10 group/row">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-3">
        <h2 className="row-title text-base sm:text-lg font-semibold text-white">
          {title ?? 'Continue Watching'}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2">
        {items.map((item) => {
          const href =
            item.mediaType === 'movie'
              ? `/movie/${item.mediaId}`
              : `/tv/${item.mediaId}/${item.season ?? 1}/${item.episode ?? 1}`;
          const poster = getImageUrl(item.posterPath, 'w342');

          return (
            <Link
              key={item.key}
              href={href}
              tabIndex={0}
              className="tv-card group flex-shrink-0 w-36 sm:w-44 block rounded-lg focus:outline-none"
            >
               <div className="tv-card-overlay-parent relative aspect-[2/3] rounded-lg overflow-hidden bg-card ring-1 ring-white/5 group-hover:ring-white/10 group-focus:ring-white/15 transition">
                {poster ? (
                  <Image
                    src={poster}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 144px, 176px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105 group-focus:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-card text-gray-600 text-xs text-center px-2">
                    {item.title}
                  </div>
                )}

                 <div className="tv-card-overlay absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 fill-white text-white" />
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeItem(item);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity p-1.5 rounded-full bg-black/60 text-gray-200 hover:bg-black/80"
                  title="Remove from Continue Watching"
                  aria-label="Remove from Continue Watching"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                 <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/15">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {item.mediaType === 'tv' &&
                  item.season != null &&
                  item.episode != null && (
                    <div className="absolute top-2 left-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded font-medium">
                      S{item.season}E{item.episode}
                    </div>
                  )}
              </div>

              <div className="mt-1.5 px-0.5">
                <p className="text-xs font-medium text-gray-200 truncate leading-tight">
                  {item.title}
                </p>
                 <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                  {formatTimeLeft(item.duration ?? 0, item.progress)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
