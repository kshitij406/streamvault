'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, ChevronDown } from 'lucide-react';
import { Season, Episode, SeasonDetails } from '@/types';
import { getImageUrl } from '@/lib/tmdb';

interface Props {
  tvId: number;
  seasons: Season[];
  initialSeason: SeasonDetails;
}

export default function EpisodeList({ tvId, seasons, initialSeason }: Props) {
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason.season_number);
  const [seasonData, setSeasonData] = useState<SeasonDetails>(initialSeason);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSeason === initialSeason.season_number) {
      setSeasonData(initialSeason);
      return;
    }
    setLoading(true);
    fetch(
      `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/tv/${tvId}/season/${selectedSeason}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}`,
        },
      }
    )
      .then((r) => r.json())
      .then((data: SeasonDetails) => {
        setSeasonData(data);
      })
      .finally(() => setLoading(false));
  }, [selectedSeason, tvId, initialSeason]);

  return (
    <section className="px-4 sm:px-6 lg:px-8 mb-10">
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-white">Episodes</h2>

        <div className="relative">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="appearance-none bg-card border border-white/10 text-white text-sm rounded-lg px-4 py-2 pr-8 cursor-pointer focus:outline-none focus:border-accent"
          >
            {validSeasons.map((s) => (
              <option key={s.season_number} value={s.season_number}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {seasonData.episodes?.map((ep) => (
            <EpisodeItem key={ep.id} episode={ep} tvId={tvId} />
          ))}
        </div>
      )}
    </section>
  );
}

function EpisodeItem({ episode, tvId }: { episode: Episode; tvId: number }) {
  const still = getImageUrl(episode.still_path, 'w300');
  const href = `/tv/${tvId}/${episode.season_number}/${episode.episode_number}`;

  return (
    <Link
      href={href}
      className="flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
    >
      <div className="relative flex-shrink-0 w-32 sm:w-40 aspect-video rounded-md overflow-hidden bg-card">
        {still ? (
          <Image
            src={still}
            alt={episode.name}
            fill
            sizes="160px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
            E{episode.episode_number}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-accent/90 flex items-center justify-center">
            <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-100 leading-tight">
            <span className="text-gray-500 mr-1.5">{episode.episode_number}.</span>
            {episode.name}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {episode.runtime && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {episode.runtime}m
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-0.5">{episode.air_date}</p>

        {episode.overview && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
            {episode.overview}
          </p>
        )}

        {episode.vote_average > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-400">{episode.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
