import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock, Calendar, Play } from 'lucide-react';
import { getMovie, getMovieCredits, getSimilarMovies, getImageUrl } from '@/lib/tmdb';
import Player from '@/components/Player';
import CastRow from '@/components/CastRow';
import MediaRow from '@/components/MediaRow';
import WatchlistButton from '@/components/WatchlistButton';
import ResumeButton from '@/components/ResumeButton';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  try {
    const movie = await getMovie(Number(params.id));
    return { title: `${movie.title} — StreamVault` };
  } catch {
    return { title: 'Movie — StreamVault' };
  }
}

export default async function MoviePage({ params }: Props) {
  const id = Number(params.id);
  if (isNaN(id)) notFound();

  const [movie, credits, similar] = await Promise.all([
    getMovie(id).catch(() => null),
    getMovieCredits(id).catch(() => ({ cast: [], crew: [] })),
    getSimilarMovies(id).catch(() => []),
  ]);

  if (!movie) notFound();

  const backdrop = getImageUrl(movie.backdrop_path, 'original');
  const poster = getImageUrl(movie.poster_path, 'w500');
  const year = movie.release_date?.slice(0, 4);
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;

  const watchlistItem = {
    id: movie.id,
    mediaType: 'movie' as const,
    title: movie.title,
    posterPath: movie.poster_path,
    year: year ?? '',
    rating: movie.vote_average,
    addedAt: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[55vh] min-h-[400px] w-full overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-6">
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {poster && (
            <div className="flex-shrink-0 w-36 sm:w-48">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl">
                <Image src={poster} alt={movie.title} fill sizes="192px" className="object-cover" />
              </div>
            </div>
          )}

          <div className="flex-1 pt-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-1">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-sm text-gray-400 italic mb-3">{movie.tagline}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-400">
              {year && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {runtime}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-white font-medium">{movie.vote_average.toFixed(1)}</span>
              </span>
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-300 border border-white/10"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {movie.overview && (
              <p className="text-sm text-gray-300 leading-relaxed max-w-2xl mb-5">
                {movie.overview}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/movie/${id}`}
                className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Now
              </Link>
              <ResumeButton mediaType="movie" id={id} />
              <WatchlistButton item={watchlistItem} size="md" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <Player mediaType="movie" id={id} />
        </div>

        <CastRow cast={credits.cast} />

        {similar.length > 0 && (
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <MediaRow title="Similar Movies" items={similar} mediaType="movie" />
          </div>
        )}
      </div>
    </div>
  );
}
