'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Play, Info } from 'lucide-react';
import { TVShow } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import { getProgress, formatTime } from '@/lib/progress';
import WatchlistButton from './WatchlistButton';

interface Props {
  show: TVShow;
}

export default function TVHero({ show }: Props) {
  const [resumeTime, setResumeTime] = useState<string | null>(null);
  const [resumeSeason, setResumeSeason] = useState<number | undefined>();
  const [resumeEpisode, setResumeEpisode] = useState<number | undefined>();
  const backdrop = getImageUrl(show.backdrop_path, 'original');
  const year = show.first_air_date?.slice(0, 4);

  useEffect(() => {
    const prog = getProgress('tv', show.id);
    if (prog && prog.progress > 2 && prog.progress < 95) {
      setResumeTime(formatTime(prog.currentTime));
      setResumeSeason(prog.season);
      setResumeEpisode(prog.episode);
    }
  }, [show.id]);

  const watchlistItem = {
    id: show.id,
    mediaType: 'tv' as const,
    title: show.name,
    posterPath: show.poster_path,
    year: year ?? '',
    rating: show.vote_average,
    addedAt: 0,
  };

  const resumeHref =
    resumeSeason && resumeEpisode
      ? `/tv/${show.id}/${resumeSeason}/${resumeEpisode}`
      : `/tv/${show.id}/1/1`;

  return (
    <div className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
      {backdrop && (
        <Image
          src={backdrop}
          alt={show.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="absolute bottom-16 left-0 right-0 px-4 sm:px-6 lg:px-8 max-w-2xl">
        <span className="inline-block text-xs font-semibold bg-purple-600/80 text-white px-2.5 py-1 rounded-full mb-3">
          TV Series
        </span>

        <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
          {show.name}
        </h1>

        {show.overview && (
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 mb-6 leading-relaxed">
            {show.overview}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {resumeTime ? (
            <Link
              href={resumeHref}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <Play className="w-4 h-4 fill-black" />
              Resume {resumeTime}
            </Link>
          ) : (
            <Link
              href={`/tv/${show.id}/1/1`}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <Play className="w-4 h-4 fill-black" />
              Play S1E1
            </Link>
          )}

          <Link
            href={`/tv/${show.id}`}
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
