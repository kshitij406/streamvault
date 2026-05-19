import { cookies } from 'next/headers';
import {
  getTrendingMovies,
  getTrendingTV,
  getTopRatedMovies,
  getPopularTV,
  getDiscoverMovies,
} from '@/lib/tmdb';
import HeroSection from '@/components/HeroSection';
import MediaRow from '@/components/MediaRow';
import ContinueWatching from '@/components/ContinueWatching';

export default async function HomePage() {
  // Read watch history cookie for personalized genre recommendations
  const historyCookie = cookies().get('sv_h')?.value;
  let topGenres: number[] = [];
  if (historyCookie) {
    try {
      const history = JSON.parse(decodeURIComponent(historyCookie)) as Array<{
        g?: number[];
      }>;
      const freq: Record<number, number> = {};
      for (const item of history) {
        for (const g of item.g ?? []) freq[g] = (freq[g] ?? 0) + 1;
      }
      topGenres = Object.entries(freq)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
        .map(([id]) => Number(id));
    } catch {
      // Malformed cookie — ignore
    }
  }

  const [trendingMovies, trendingTV, topRated, popularTV, recommended] = await Promise.all([
    getTrendingMovies(),
    getTrendingTV(),
    getTopRatedMovies(),
    getPopularTV(),
    topGenres.length ? getDiscoverMovies(topGenres) : Promise.resolve([] as Awaited<ReturnType<typeof getTrendingMovies>>),
  ]);

  const heroMovie =
    trendingMovies[Math.floor(Math.random() * Math.min(5, trendingMovies.length))];

  return (
    <div className="min-h-screen bg-background">
      {heroMovie && <HeroSection movie={heroMovie} />}

      <div className="pt-6 pb-12">
        {/* Continue Watching — client component reads sv_h cookie */}
        <ContinueWatching />

        {recommended.length > 0 && (
          <MediaRow
            title="Recommended For You"
            items={recommended}
            mediaType="movie"
          />
        )}

        <MediaRow title="Trending Movies" items={trendingMovies} mediaType="movie" />
        <MediaRow title="Trending TV Shows" items={trendingTV} mediaType="tv" />
        <MediaRow title="Top Rated Movies" items={topRated} mediaType="movie" />
        <MediaRow title="Popular TV Shows" items={popularTV} mediaType="tv" />
      </div>
    </div>
  );
}
