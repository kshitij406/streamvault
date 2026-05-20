import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
} from '@/lib/tmdb';
import HeroCarousel from '@/components/HeroCarousel';
import MediaRow from '@/components/MediaRow';
import { Film } from 'lucide-react';
import { ContinueWatchingFiltered } from '@/components/ContinueWatching';
import BecauseYouWatched from '@/components/BecauseYouWatched';

export const metadata = { title: 'Movies — StreamVault' };

export default async function MoviesPage() {
  const [trending, popular, topRated, nowPlaying, upcoming] = await Promise.all([
    getTrendingMovies(),
    getPopularMovies(),
    getTopRatedMovies(),
    getNowPlayingMovies(),
    getUpcomingMovies(),
  ]);

  const heroItems = trending
    .slice(0, 8)
    .map((m) => ({ mediaType: 'movie' as const, item: m }));

  return (
    <div className="min-h-screen bg-background">
      {heroItems.length > 0 && <HeroCarousel items={heroItems} label="Movies" />}

      <div className="pt-6 pb-12">
        <div className="flex items-center gap-2.5 px-4 sm:px-6 lg:px-8 mb-6">
          <Film className="w-5 h-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Movies</h1>
        </div>

        <ContinueWatchingFiltered mediaType="movie" title="Continue Watching Movies" />
        <BecauseYouWatched mediaTypeFilter="movie" />

        <MediaRow title="Trending This Week" items={trending} mediaType="movie" />
        <MediaRow title="Popular Now" items={popular} mediaType="movie" />
        <MediaRow title="Top Rated All Time" items={topRated} mediaType="movie" />
        <MediaRow title="Now Playing in Theaters" items={nowPlaying} mediaType="movie" />
        <MediaRow title="Coming Soon" items={upcoming} mediaType="movie" />
      </div>
    </div>
  );
}
