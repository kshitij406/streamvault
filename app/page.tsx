import { cookies } from 'next/headers';
import {
  getTrendingMovies,
  getTrendingTV,
  getTopRatedMovies,
  getPopularTV,
  getDiscoverMovies,
  getMovieRecommendations,
  getTVRecommendations,
} from '@/lib/tmdb';
import { Movie, TVShow } from '@/types';
import HeroSection from '@/components/HeroSection';
import MediaRow from '@/components/MediaRow';
import ContinueWatching from '@/components/ContinueWatching';

export default async function HomePage() {
  const historyCookie = cookies().get('sv_h')?.value;
  let topGenres: number[] = [];
  let lastWatched: { id: number; mediaType: 'movie' | 'tv'; title: string } | null = null;

  if (historyCookie) {
    try {
      const history = JSON.parse(decodeURIComponent(historyCookie)) as Array<{
        i?: number; m?: 'movie' | 'tv'; t?: string; g?: number[];
      }>;

      const freq: Record<number, number> = {};
      for (const item of history) {
        for (const g of item.g ?? []) freq[g] = (freq[g] ?? 0) + 1;
      }
      topGenres = Object.entries(freq)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
        .map(([id]) => Number(id));

      if (history.length > 0 && history[0].i && history[0].m) {
        lastWatched = { id: history[0].i, mediaType: history[0].m, title: history[0].t ?? '' };
      }
    } catch {
      // Malformed cookie — ignore
    }
  }

  const becausePromise: Promise<(Movie | TVShow)[]> = lastWatched
    ? lastWatched.mediaType === 'movie'
      ? getMovieRecommendations(lastWatched.id).catch(() => [])
      : getTVRecommendations(lastWatched.id).catch(() => [])
    : Promise.resolve([]);

  const [trendingMovies, trendingTV, topRated, popularTV, recommended, becauseItems] = await Promise.all([
    getTrendingMovies(),
    getTrendingTV(),
    getTopRatedMovies(),
    getPopularTV(),
    topGenres.length ? getDiscoverMovies(topGenres) : Promise.resolve([] as Awaited<ReturnType<typeof getTrendingMovies>>),
    becausePromise,
  ]);

  const heroMovie =
    trendingMovies[Math.floor(Math.random() * Math.min(5, trendingMovies.length))];

  return (
    <div className="min-h-screen bg-background">
      {heroMovie && <HeroSection movie={heroMovie} />}

      <div className="pt-6 pb-12">
        <ContinueWatching />

        {becauseItems.length > 0 && lastWatched && (
          <MediaRow
            title={`Because you watched ${lastWatched.title}`}
            items={becauseItems}
            mediaType={lastWatched.mediaType}
          />
        )}

        {recommended.length > 0 && (
          <MediaRow title="Recommended For You" items={recommended} mediaType="movie" />
        )}

        <MediaRow title="Trending Movies" items={trendingMovies} mediaType="movie" />
        <MediaRow title="Trending TV Shows" items={trendingTV} mediaType="tv" />
        <MediaRow title="Top Rated Movies" items={topRated} mediaType="movie" />
        <MediaRow title="Popular TV Shows" items={popularTV} mediaType="tv" />
      </div>
    </div>
  );
}
