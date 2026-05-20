'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb';
import { getLocalInProgress, type LocalEntry } from '@/lib/localHistory';
import { getHistory } from '@/lib/history';

interface DisplayEntry {
  key: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  progress: number;
  season?: number;
  episode?: number;
  lastWatched?: number;
}

function fromLocal(h: LocalEntry): DisplayEntry {
  return {
    key: `${h.mediaType}-${h.mediaId}-${h.season}-${h.episode}`,
    mediaId: h.mediaId,
    mediaType: h.mediaType,
    title: h.title,
    posterPath: h.posterPath,
    progress: h.progress,
    season: h.season ?? undefined,
    episode: h.episode ?? undefined,
    lastWatched: h.lastWatched,
  };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export default function ContinueWatching() {
  const [items, setItems] = useState<DisplayEntry[]>([]);

  useEffect(() => {
    // Read from localStorage immediately — works without login
    const local = getLocalInProgress().map(fromLocal);
    const map = new Map<string, DisplayEntry>();
    for (const h of local) map.set(h.key, h);

    // Cookie history fallback (some TV browsers restrict localStorage)
    try {
      for (const h of getHistory()) {
        const p = clamp(h.progress);
        if (p < 2 || p > 95) continue;
        const key = `${h.mediaType}-${h.id}-${h.season ?? null}-${h.episode ?? null}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            mediaId: h.id,
            mediaType: h.mediaType,
            title: h.title,
            posterPath: h.posterPath,
            progress: p,
            season: h.season,
            episode: h.episode,
            lastWatched: h.lastWatched,
          });
        }
      }
    } catch {
      // ignore cookie parse errors
    }

    if (map.size)
      setItems(
        Array.from(map.values()).sort(
          (a, b) => (b.lastWatched ?? 0) - (a.lastWatched ?? 0),
        ),
      );

    // Also try API (logged-in users get cross-device history merged in)
    fetch('/api/history?in_progress=true')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.history?.length) return;
        // Overlay API entries (may include other-device progress)
        // Overlay API entries (may include other-device progress)
        for (const r of data.history as Record<string, unknown>[]) {
          const key = `${r.media_type}-${r.media_id}-${r.season ?? null}-${r.episode ?? null}`;
          map.set(key, {
            key,
            mediaId: r.media_id as number,
            mediaType: r.media_type as 'movie' | 'tv',
            title: r.title as string,
            posterPath: (r.poster_path as string) ?? null,
            progress: clamp(r.progress as number),
            season: (r.season as number | null) ?? undefined,
            episode: (r.episode as number | null) ?? undefined,
            lastWatched:
              typeof r.last_watched === 'string' || typeof r.last_watched === 'number'
                ? new Date(r.last_watched as string | number).getTime()
                : undefined,
          });
        }
        setItems(
          Array.from(map.values()).sort(
            (a, b) => (b.lastWatched ?? 0) - (a.lastWatched ?? 0),
          ),
        );
      })
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <section className="mb-10 group/row">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-3">
        <h2 className="row-title text-base sm:text-lg font-semibold text-white">
          Continue Watching
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
                  {Math.round(item.progress)}% watched
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
