import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock, Calendar, Play } from 'lucide-react';
import {
  getMovie,
  getMovieCredits,
  getSimilarMovies,
  getMovieExternalIds,
  getImageUrl,
} from '@/lib/tmdb';
import { getExternalRatings } from '@/lib/omdb';
import Player from '@/components/Player';
import CastRow from '@/components/CastRow';
import MediaRow from '@/components/MediaRow';
import WatchlistButton from '@/components/WatchlistButton';
import ResumeButton from '@/components/ResumeButton';
import StarRating from '@/components/StarRating';
import WatchedButton from '@/components/WatchedButton';
import TrailerButton from '@/components/TrailerButton';

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

  const [movie, credits, similar, externalIds] = await Promise.all([
    getMovie(id).catch(() => null),
    getMovieCredits(id).catch(() => ({ cast: [], crew: [] })),
    getSimilarMovies(id).catch(() => []),
    getMovieExternalIds(id).catch(() => ({ imdb_id: null })),
  ]);

  if (!movie) notFound();

  const externalRatings = externalIds.imdb_id
    ? await getExternalRatings(externalIds.imdb_id)
    : { imdb: null, rottenTomatoes: null };

  const backdrop = getImageUrl(movie.backdrop_path, 'original');
  const poster = getImageUrl(movie.poster_path, 'w500');
  const year = movie.release_date?.slice(0, 4);
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const genreIds = movie.genres?.map((g) => g.id) ?? movie.genre_ids ?? [];

  const watchlistItem = {
    id: movie.id,
    mediaType: 'movie' as const,
    title: movie.title,
    posterPath: movie.poster_path,
    year: year ?? '',
    rating: movie.vote_average,
    addedAt: 0,
  };

  const letterboxdUrl = `https://letterboxd.com/search/films/${encodeURIComponent(movie.title)}/`;
  const imdbUrl = externalIds.imdb_id ? `https://www.imdb.com/title/${externalIds.imdb_id}/` : null;

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

            <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-400">
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
            </div>

            {/* Rating badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-[#01b4e4]/10 border border-[#01b4e4]/30 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#01b4e4]">
                <Star className="w-3 h-3 fill-current" />
                <span>{movie.vote_average.toFixed(1)}</span>
                <span className="opacity-50 text-[10px]">TMDB</span>
              </div>

              {externalRatings.imdb && imdbUrl && (
                <a
                  href={imdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#f5c518]/10 border border-[#f5c518]/30 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#f5c518] hover:bg-[#f5c518]/20 transition-colors"
                >
                  <span className="opacity-70 text-[10px]">IMDB</span>
                  <span>{externalRatings.imdb}</span>
                </a>
              )}

              {externalRatings.rottenTomatoes && (
                <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400">
                  <span className="opacity-70 text-[10px]">RT</span>
                  <span>{externalRatings.rottenTomatoes}</span>
                </div>
              )}

              <a
                href={letterboxdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#40bcf4]/10 border border-[#40bcf4]/30 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#40bcf4] hover:bg-[#40bcf4]/20 transition-colors"
              >
                <span className="opacity-70 text-[10px]">LB</span>
                <span>Letterboxd ↗</span>
              </a>
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
              <TrailerButton mediaType="movie" id={id} title={movie.title} />
              <ResumeButton mediaType="movie" id={id} />
              <WatchlistButton item={watchlistItem} size="md" />
              <WatchedButton mediaType="movie" id={id} />
            </div>

            <div className="mt-4">
              <StarRating mediaType="movie" id={id} />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <Player
            mediaType="movie"
            id={id}
            title={movie.title}
            posterPath={movie.poster_path}
            year={year}
            genreIds={genreIds}
          />
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
