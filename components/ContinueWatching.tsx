'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { getHistory, type HistoryEntry } from '@/lib/history';
import { getImageUrl } from '@/lib/tmdb';

export default function ContinueWatching() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const h = getHistory().filter((e) => e.progress >= 2 && e.progress <= 95);
    setItems(h);
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
              ? `/movie/${item.id}`
              : `/tv/${item.id}/${item.season ?? 1}/${item.episode ?? 1}`;
          const poster = getImageUrl(item.posterPath, 'w342');

          return (
            <Link
              key={`${item.mediaType}-${item.id}`}
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

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {item.mediaType === 'tv' && item.season != null && item.episode != null && (
                  <div className="absolute top-2 left-2 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded font-medium">
                    S{item.season}E{item.episode}
                  </div>
                )}
              </div>

              <div className="mt-1.5 px-0.5">
                <p className="text-xs font-medium text-gray-200 truncate leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{Math.round(item.progress)}% watched</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
