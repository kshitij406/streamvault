'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Play, Star } from 'lucide-react';
import { Movie, TVShow } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import WatchlistButton from './WatchlistButton';
import TrailerModal from './TrailerModal';

type Props = {
  item: Movie | TVShow;
  mediaType: 'movie' | 'tv';
};

export default function MediaCard({ item, mediaType }: Props) {
  const isMovie = mediaType === 'movie';
  const movie = item as Movie;
  const tv = item as TVShow;

  const title = isMovie ? movie.title : tv.name;
  const year = isMovie
    ? movie.release_date?.slice(0, 4)
    : tv.first_air_date?.slice(0, 4);
  const poster = getImageUrl(item.poster_path, 'w342');
  const href = `/${mediaType}/${item.id}`;

  const [openTrailer, setOpenTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!hovered) return;
    if (fetched.current) return;
    fetched.current = true;
    fetch(`/api/trailer?type=${mediaType}&id=${item.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.key === 'string' || d?.key === null) setTrailerKey(d.key);
      })
      .catch(() => {
        // ignore
      });
  }, [hovered, mediaType, item.id]);

  const watchlistItem = {
    id: item.id,
    mediaType,
    title,
    posterPath: item.poster_path,
    year: year ?? '',
    rating: item.vote_average,
    addedAt: 0,
  };

  return (
    <>
      <Link
        href={href}
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        className="tv-card group flex-shrink-0 w-36 sm:w-44 block rounded-lg focus:outline-none"
      >
        {/* tv-card-overlay-parent enables focus-within styles in TV mode */}
        <div className="sv-lift tv-card-overlay-parent relative aspect-[2/3] rounded-lg overflow-hidden bg-card ring-1 ring-white/5">
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              sizes="(max-width: 640px) 144px, 176px"
              className="object-cover transition-transform duration-300 group-hover:scale-105 group-focus:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card text-gray-600 text-xs text-center px-2">
              {title}
            </div>
          )}

          {/* Overlay — visible on hover OR focus */}
          <div className="tv-card-overlay absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200" />

          <div className="tv-card-overlay absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200">
            <WatchlistButton item={watchlistItem} size="sm" />
          </div>

          {/* Trailer action */}
          <div className="tv-card-overlay absolute left-2 right-2 bottom-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setHovered(true);
                setOpenTrailer(true);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-2 backdrop-blur-md ring-1 ring-white/10"
              title="Watch trailer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Trailer
            </button>
          </div>

          {/* Info strip — slides up on hover OR focus */}
          <div className="tv-card-info absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 group-focus:translate-y-0 transition-transform duration-200">
            <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">{title}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">{year}</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-gray-300">{item.vote_average.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 px-0.5">
          <p className="text-xs font-medium text-gray-200 truncate leading-tight">{title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-gray-500">{year}</span>
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-400">{item.vote_average.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Link>

      <TrailerModal
        open={openTrailer}
        title={title}
        youtubeKey={trailerKey}
        onClose={() => setOpenTrailer(false)}
      />
    </>
  );
}
