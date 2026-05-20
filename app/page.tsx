import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
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
import BecauseYouWatched from '@/components/BecauseYouWatched';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Personalised genre recommendations — login only
  let topGenres: number[] = [];
  if (session?.user?.id) {
    const rows = await sql`
      SELECT genre_ids FROM watch_history
      WHERE user_id = ${session.user.id}
      ORDER BY last_watched DESC LIMIT 10
    `.catch(() => []);

    const freq: Record<number, number> = {};
    for (const row of rows) {
      for (const g of (row.genre_ids as number[]) ?? []) {
        freq[g] = (freq[g] ?? 0) + 1;
      }
    }
    topGenres = Object.entries(freq)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([id]) => Number(id));
  }

  const [trendingMovies, trendingTV, topRated, popularTV, recommended] =
    await Promise.all([
      getTrendingMovies(),
      getTrendingTV(),
      getTopRatedMovies(),
      getPopularTV(),
      topGenres.length
        ? getDiscoverMovies(topGenres)
        : Promise.resolve([] as Awaited<ReturnType<typeof getTrendingMovies>>),
    ]);

  const heroMovie =
    trendingMovies[Math.floor(Math.random() * Math.min(5, trendingMovies.length))];

  return (
    <div className="min-h-screen bg-background">
      {heroMovie && <HeroSection movie={heroMovie} />}

      <div className="pt-6 pb-12">
        {/* Works for everyone via localStorage */}
        <ContinueWatching />
        <BecauseYouWatched />

        {/* Login-only: genre-based discovery */}
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
