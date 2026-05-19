import {
  getTrendingMovies,
  getTrendingTV,
  getTopRatedMovies,
  getPopularTV,
} from '@/lib/tmdb';
import HeroSection from '@/components/HeroSection';
import MediaRow from '@/components/MediaRow';

export default async function HomePage() {
  const [trendingMovies, trendingTV, topRated, popularTV] = await Promise.all([
    getTrendingMovies(),
    getTrendingTV(),
    getTopRatedMovies(),
    getPopularTV(),
  ]);

  const heroMovie = trendingMovies[Math.floor(Math.random() * Math.min(5, trendingMovies.length))];

  return (
    <div className="min-h-screen bg-background">
      {heroMovie && <HeroSection movie={heroMovie} />}

      <div className="pt-6 pb-12">
        <MediaRow title="Trending Movies" items={trendingMovies} mediaType="movie" />
        <MediaRow title="Trending TV Shows" items={trendingTV} mediaType="tv" />
        <MediaRow title="Top Rated Movies" items={topRated} mediaType="movie" />
        <MediaRow title="Popular TV Shows" items={popularTV} mediaType="tv" />
      </div>
    </div>
  );
}
