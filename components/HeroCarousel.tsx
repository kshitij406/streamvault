'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Info, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie, TVShow } from '@/types';
import { getImageUrl } from '@/lib/tmdb';

type HeroItem =
  | { mediaType: 'movie'; item: Movie }
  | { mediaType: 'tv'; item: TVShow };

export default function HeroCarousel({
  items,
  autoMs = 6500,
  label,
}: {
  items: HeroItem[];
  autoMs?: number;
  label?: string;
}) {
  const list = useMemo(() => items.slice(0, 8), [items]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (list.length <= 1 || paused) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % list.length), autoMs);
    return () => window.clearInterval(t);
  }, [list.length, autoMs, paused]);

  const current = list[idx];
  if (!current) return null;

  const isMovie = current.mediaType === 'movie';
  const title = isMovie ? current.item.title : current.item.name;
  const overview = current.item.overview;
  const backdrop = getImageUrl(current.item.backdrop_path, 'original');
  const href = isMovie ? `/movie/${current.item.id}` : `/tv/${current.item.id}`;
  const primaryPlayHref = isMovie ? href : `/tv/${current.item.id}/1/1`;

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[62vh] min-h-[420px] sm:h-[76vh] sm:min-h-[560px] w-full overflow-hidden">
        {backdrop && (
          <Image
            src={backdrop}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-top scale-[1.02]"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        <div className="absolute inset-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="h-full flex items-end pb-12 sm:pb-16">
              <div className="max-w-2xl">
                {label && (
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="text-[11px] font-semibold tracking-wide text-gray-200 bg-white/10 ring-1 ring-white/10 px-3 py-1 rounded-full">
                      {label}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {idx + 1}/{list.length}
                    </span>
                  </div>
                )}

                <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                  {title}
                </h1>
                {overview && (
                  <p className="mt-4 text-sm sm:text-base text-gray-200/90 leading-relaxed line-clamp-3">
                    {overview}
                  </p>
                )}

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href={primaryPlayHref}
                    className="hero-btn flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    Play
                  </Link>
                  <Link
                    href={href}
                    className="hero-btn flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors ring-1 ring-white/10"
                  >
                    <Info className="w-4 h-4" />
                    More Info
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {list.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIdx((i) => (i - 1 + list.length) % list.length)}
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/45 backdrop-blur-md ring-1 ring-white/10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => (i + 1) % list.length)}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-black/30 hover:bg-black/45 backdrop-blur-md ring-1 ring-white/10"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Netflix-like card indicators */}
      {list.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-7 relative z-10">
          <div className="flex items-center gap-2">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ring-1 ring-white/10 ${
                  i === idx ? 'w-10 bg-white/90' : 'w-4 bg-white/20 hover:bg-white/30'
                }`}
                aria-label={`Show ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
