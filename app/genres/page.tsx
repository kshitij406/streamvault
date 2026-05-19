import Link from 'next/link';
import { getGenreMovies, getGenreTV } from '@/lib/tmdb';
import MediaRow from '@/components/MediaRow';
import { LayoutGrid } from 'lucide-react';

const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
  { id: 99, name: 'Documentary' },
  { id: 16, name: 'Animation' },
  { id: 10751, name: 'Family' },
];

const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 27, name: 'Horror' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
  { id: 10751, name: 'Family' },
  { id: 37, name: 'Western' },
];

interface Props {
  searchParams: { type?: string; id?: string };
}

export default async function GenresPage({ searchParams }: Props) {
  const type = searchParams.type === 'tv' ? 'tv' : 'movie';
  const genres = type === 'movie' ? MOVIE_GENRES : TV_GENRES;
  const defaultId = type === 'movie' ? 28 : 10759;
  const genreId = searchParams.id ? Number(searchParams.id) : defaultId;
  const activeGenre = genres.find(g => g.id === genreId) ?? genres[0];

  const items = type === 'movie'
    ? await getGenreMovies(activeGenre.id)
    : await getGenreTV(activeGenre.id);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <LayoutGrid className="w-6 h-6 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Browse by Genre</h1>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 mb-5">
          <Link
            href={`/genres?type=movie&id=${MOVIE_GENRES[0].id}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              type === 'movie'
                ? 'bg-accent text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Movies
          </Link>
          <Link
            href={`/genres?type=tv&id=${TV_GENRES[0].id}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              type === 'tv'
                ? 'bg-accent text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            TV Shows
          </Link>
        </div>

        {/* Genre pills */}
        <div className="flex flex-wrap gap-2">
          {genres.map(g => (
            <Link
              key={g.id}
              href={`/genres?type=${type}&id=${g.id}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                g.id === activeGenre.id
                  ? 'bg-accent border-accent text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      <MediaRow
        title={`${activeGenre.name} ${type === 'movie' ? 'Movies' : 'Shows'}`}
        items={items}
        mediaType={type}
      />
    </div>
  );
}
