'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb';
import { getLocalInProgress, type LocalEntry } from '@/lib/localHistory';

interface DisplayEntry {
  key: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  progress: number;
  season?: number;
  episode?: number;
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
  };
}

export default function ContinueWatching() {
  const [items, setItems] = useState<DisplayEntry[]>([]);

  useEffect(() => {
    // Read from localStorage immediately — works without login
    const local = getLocalInProgress().map(fromLocal);
    if (local.length) setItems(local);

    // Also try API (logged-in users get cross-device history merged in)
    fetch('/api/history?in_progress=true')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.history?.length) return;
        // Build a map from local entries keyed by identity
        const map = new Map<string, DisplayEntry>();
        for (const h of local) map.set(h.key, h);
        // Overlay API entries (may include other-device progress)
        for (const r of data.history as Record<string, unknown>[]) {
          const key = `${r.media_type}-${r.media_id}-${r.season ?? null}-${r.episode ?? null}`;
          map.set(key, {
            key,
            mediaId: r.media_id as number,
            mediaType: r.media_type as 'movie' | 'tv',
            title: r.title as string,
            posterPath: (r.poster_path as string) ?? null,
            progress: r.progress as number,
            season: (r.season as number | null) ?? undefined,
            episode: (r.episode as number | null) ?? undefined,
          });
        }
        setItems(Array.from(map.values()));
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
              <div className="tv-card-overlay-parent relative aspect-[2/3] rounded-lg overflow-hidden bg-card">
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

                <div className="tv-card-overlay absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-10 h-10 fill-white text-white" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
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
                <p className="text-xs text-gray-500 mt-0.5">
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
