import {
  getTrendingTV,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
} from '@/lib/tmdb';
import MediaRow from '@/components/MediaRow';
import TVHero from '@/components/TVHero';
import { Tv } from 'lucide-react';

export const metadata = { title: 'TV Shows — StreamVault' };

export default async function TVShowsPage() {
  const [trending, popular, topRated, onTheAir] = await Promise.all([
    getTrendingTV(),
    getPopularTV(),
    getTopRatedTV(),
    getOnTheAirTV(),
  ]);

  const hero = trending[Math.floor(Math.random() * Math.min(5, trending.length))];

  return (
    <div className="min-h-screen bg-background">
      {hero && <TVHero show={hero} />}

      <div className="pt-6 pb-12">
        <div className="flex items-center gap-2.5 px-4 sm:px-6 lg:px-8 mb-6">
          <Tv className="w-5 h-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">TV Shows</h1>
        </div>

        <MediaRow title="Trending This Week" items={trending} mediaType="tv" />
        <MediaRow title="Popular Shows" items={popular} mediaType="tv" />
        <MediaRow title="Top Rated All Time" items={topRated} mediaType="tv" />
        <MediaRow title="Currently Airing" items={onTheAir} mediaType="tv" />
      </div>
    </div>
  );
}
