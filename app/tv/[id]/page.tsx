import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, Play } from 'lucide-react';
import {
  getTVShow,
  getTVCredits,
  getTVSeason,
  getSimilarTV,
  getImageUrl,
} from '@/lib/tmdb';
import CastRow from '@/components/CastRow';
import MediaRow from '@/components/MediaRow';
import WatchlistButton from '@/components/WatchlistButton';
import ResumeButton from '@/components/ResumeButton';
import EpisodeList from '@/components/EpisodeList';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  try {
    const show = await getTVShow(Number(params.id));
    return { title: `${show.name} — StreamVault` };
  } catch {
    return { title: 'TV Show — StreamVault' };
  }
}

export default async function TVPage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [show, credits, similar] = await Promise.all([
    getTVShow(id).catch(() => null),
    getTVCredits(id).catch(() => ({ cast: [], crew: [] })),
    getSimilarTV(id).catch(() => []),
  ]);

  if (!show) notFound();

  const validSeasons = (show.seasons ?? []).filter((s) => s.season_number > 0);
  const firstSeason = validSeasons[0];
  const initialSeason = firstSeason
    ? await getTVSeason(id, firstSeason.season_number).catch(() => null)
    : null;

  const backdrop = getImageUrl(show.backdrop_path, 'original');
  const poster = getImageUrl(show.poster_path, 'w500');
  const year = show.first_air_date?.slice(0, 4);

  const watchlistItem = {
    id: show.id,
    mediaType: 'tv' as const,
    title: show.name,
    posterPath: show.poster_path,
    year: year ?? '',
    rating: show.vote_average,
    addedAt: 0,
  };

  const firstEp = initialSeason?.episodes?.[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[55vh] min-h-[400px] w-full overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-6">
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {poster && (
            <div className="flex-shrink-0 w-36 sm:w-48">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
                <Image src={poster} alt={show.name} fill sizes="192px" className="object-cover" />
              </div>
            </div>
          )}

          <div className="flex-1 pt-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-1">
              {show.name}
            </h1>

            {show.tagline && (
              <p className="text-sm text-gray-400 italic mb-3">{show.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-400">
              {year && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {year}
                </span>
              )}
              {show.number_of_seasons && (
                <span className="text-gray-400">
                  {show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-white font-medium">{show.vote_average.toFixed(1)}</span>
              </span>
            </div>

            {show.genres && show.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {show.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {show.overview && (
              <p className="text-sm text-gray-300 leading-relaxed max-w-2xl mb-5">
                {show.overview}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {firstEp && (
                <Link
                  href={`/tv/${id}/${firstSeason.season_number}/1`}
                  className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Play S1E1
                </Link>
              )}
              <ResumeButton mediaType="tv" id={id} />
              <WatchlistButton item={watchlistItem} size="md" />
            </div>
          </div>
        </div>

        <CastRow cast={credits.cast} />

        {initialSeason && validSeasons.length > 0 && (
          <EpisodeList
            tvId={id}
            seasons={validSeasons}
            initialSeason={initialSeason}
          />
        )}

        {similar.length > 0 && (
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <MediaRow title="Similar Shows" items={similar} mediaType="tv" />
          </div>
        )}
      </div>
    </div>
  );
}
