'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Episode } from '@/types';
import { getImageUrl } from '@/lib/tmdb';

interface Props {
  episodes: Episode[];
  tvId: number;
  currentEpisode: number;
  currentSeason: number;
}

export default function EpisodeSidebar({ episodes, tvId, currentEpisode, currentSeason }: Props) {
  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Season {currentSeason} Episodes</h3>
      </div>
      <div className="overflow-y-auto max-h-[500px] scrollbar-hide">
        {episodes.map((ep) => {
          const isActive = ep.episode_number === currentEpisode;
          const still = getImageUrl(ep.still_path, 'w185');
          return (
            <Link
              key={ep.id}
              href={`/tv/${tvId}/${currentSeason}/${ep.episode_number}`}
              className={`flex gap-3 p-3 transition-colors hover:bg-white/5 ${
                isActive ? 'bg-accent/10 border-l-2 border-accent' : ''
              }`}
            >
              <div className="relative flex-shrink-0 w-20 aspect-video rounded overflow-hidden bg-white/5">
                {still ? (
                  <Image src={still} alt={ep.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                    E{ep.episode_number}
                  </div>
                )}
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 fill-white ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isActive ? 'text-accent' : 'text-gray-200'}`}>
                  {ep.episode_number}. {ep.name}
                </p>
                {ep.air_date && (
                  <p className="text-xs text-gray-600 mt-0.5">{ep.air_date}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
