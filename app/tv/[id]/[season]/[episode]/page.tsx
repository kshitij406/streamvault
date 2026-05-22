import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { getTVShow, getTVSeason } from '@/lib/tmdb';
import Player from '@/components/Player';
import EpisodeSidebar from '@/components/EpisodeSidebar';

interface Props {
  params: { id: string; season: string; episode: string };
}

export async function generateMetadata({ params }: Props) {
  try {
    const [show, seasonData] = await Promise.all([
      getTVShow(Number(params.id)),
      getTVSeason(Number(params.id), Number(params.season)),
    ]);
    if (!show) return { title: 'Watch — StreamVault' };
    const ep = seasonData?.episodes?.find(
      (e) => e.episode_number === Number(params.episode)
    );
    return {
      title: ep
        ? `${show.name} S${params.season}E${params.episode} — ${ep.name} | StreamVault`
        : `${show.name} — StreamVault`,
    };
  } catch {
    return { title: 'Watch — StreamVault' };
  }
}

export default async function TVPlayerPage({ params }: Props) {
  const id = Number(params.id);
  const season = Number(params.season);
  const episode = Number(params.episode);

  if (isNaN(id) || isNaN(season) || isNaN(episode)) notFound();

  const [show, seasonData] = await Promise.all([
    getTVShow(id).catch(() => null),
    getTVSeason(id, season).catch(() => null),
  ]);

  if (!show || !seasonData) notFound();

  const currentEp = seasonData.episodes?.find((e) => e.episode_number === episode);
  const episodes = seasonData.episodes ?? [];

  const currentIndex = episodes.findIndex((e) => e.episode_number === episode);
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp = currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  const validSeasons = (show.seasons ?? []).filter((s) => s.season_number > 0);
  const nextSeasonNum =
    !nextEp && validSeasons.find((s) => s.season_number === season + 1)
      ? season + 1
      : null;

  return (
    <div className="min-h-screen bg-background pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={`/tv/${id}`}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {show.name}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-300">
            S{season} E{episode}
            {currentEp && ` — ${currentEp.name}`}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div>
            <Player
                mediaType="tv"
                id={id}
                season={season}
                episode={episode}
                title={show.name}
                posterPath={show.poster_path}
                year={show.first_air_date?.slice(0, 4)}
                genreIds={show.genre_ids ?? show.genres?.map((g: { id: number }) => g.id)}
              />

            <div className="mt-4">
              {currentEp && (
                <div className="mb-4">
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    {currentEp.name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Season {season}, Episode {episode}
                    {currentEp.air_date && ` · ${currentEp.air_date}`}
                  </p>
                  {currentEp.overview && (
                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                      {currentEp.overview}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 mt-5">
                {prevEp ? (
                  <Link
                    href={`/tv/${id}/${season}/${prevEp.episode_number}`}
                    className="flex items-center gap-2 bg-card hover:bg-card-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    E{prevEp.episode_number}: {prevEp.name}
                  </Link>
                ) : season > 1 ? (
                  <Link
                    href={`/tv/${id}/${season - 1}/1`}
                    className="flex items-center gap-2 bg-card hover:bg-card-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Season
                  </Link>
                ) : null}

                {nextEp ? (
                  <Link
                    href={`/tv/${id}/${season}/${nextEp.episode_number}`}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ml-auto"
                  >
                    E{nextEp.episode_number}: {nextEp.name}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : nextSeasonNum ? (
                  <Link
                    href={`/tv/${id}/${nextSeasonNum}/1`}
                    className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ml-auto"
                  >
                    Season {nextSeasonNum}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <EpisodeSidebar
              episodes={episodes}
              tvId={id}
              currentEpisode={episode}
              currentSeason={season}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
