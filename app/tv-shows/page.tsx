import {
  getTrendingTV,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
} from '@/lib/tmdb';
import MediaRow from '@/components/MediaRow';
import HeroCarousel from '@/components/HeroCarousel';
import { Tv } from 'lucide-react';
import { ContinueWatchingFiltered } from '@/components/ContinueWatching';
import BecauseYouWatched from '@/components/BecauseYouWatched';

export const metadata = { title: 'TV Shows — StreamVault' };

export default async function TVShowsPage() {
  const [trending, popular, topRated, onTheAir] = await Promise.all([
    getTrendingTV(),
    getPopularTV(),
    getTopRatedTV(),
    getOnTheAirTV(),
  ]);

  const heroItems = trending
    .slice(0, 8)
    .map((t) => ({ mediaType: 'tv' as const, item: t }));

  return (
    <div className="min-h-screen bg-background">
      {heroItems.length > 0 && <HeroCarousel items={heroItems} label="TV" />}

      <div className="pt-6 pb-12">
        <div className="flex items-center gap-2.5 px-4 sm:px-6 lg:px-8 mb-6">
          <Tv className="w-5 h-5 text-accent" />
          <h1 className="text-xl sm:text-2xl font-bold text-white">TV Shows</h1>
        </div>

        <ContinueWatchingFiltered mediaType="tv" title="Continue Watching Shows" />
        <BecauseYouWatched mediaTypeFilter="tv" />

        <MediaRow title="Trending This Week" items={trending} mediaType="tv" />
        <MediaRow title="Popular Shows" items={popular} mediaType="tv" />
        <MediaRow title="Top Rated All Time" items={topRated} mediaType="tv" />
        <MediaRow title="Currently Airing" items={onTheAir} mediaType="tv" />
      </div>
    </div>
  );
}
