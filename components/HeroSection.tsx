'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Play, Info } from 'lucide-react';
import { Movie } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import { getProgress, formatTime } from '@/lib/progress';
import WatchlistButton from './WatchlistButton';

interface Props {
  movie: Movie;
}

export default function HeroSection({ movie }: Props) {
  const [resumeTime, setResumeTime] = useState<string | null>(null);
  const backdrop = getImageUrl(movie.backdrop_path, 'original');

  useEffect(() => {
    const prog = getProgress('movie', movie.id);
    if (prog && prog.progress > 2 && prog.progress < 95) {
      setResumeTime(formatTime(prog.currentTime));
    }
  }, [movie.id]);

  const watchlistItem = {
    id: movie.id,
    mediaType: 'movie' as const,
    title: movie.title,
    posterPath: movie.poster_path,
    year: movie.release_date?.slice(0, 4) ?? '',
    rating: movie.vote_average,
    addedAt: 0,
  };

  return (
    <div className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
      {backdrop && (
        <Image
          src={backdrop}
          alt={movie.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="absolute bottom-16 left-0 right-0 px-4 sm:px-6 lg:px-8 max-w-2xl">
        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
          {movie.title}
        </h1>

        {movie.tagline && (
          <p className="text-sm text-gray-400 italic mb-3">{movie.tagline}</p>
        )}

        <p className="text-sm sm:text-base text-gray-300 line-clamp-3 mb-6 leading-relaxed">
          {movie.overview}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {resumeTime ? (
            <Link
              href={`/movie/${movie.id}`}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <Play className="w-4 h-4 fill-black" />
              Resume {resumeTime}
            </Link>
          ) : (
            <Link
              href={`/movie/${movie.id}`}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <Play className="w-4 h-4 fill-black" />
              Play
            </Link>
          )}

          <Link
            href={`/movie/${movie.id}`}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors"
          >
            <Info className="w-4 h-4" />
            More Info
          </Link>

          <WatchlistButton item={watchlistItem} size="lg" />
        </div>
      </div>
    </div>
  );
}
