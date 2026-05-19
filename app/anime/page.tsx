import { getPopularAnime, getTopRatedAnime, getNewAnime } from '@/lib/tmdb';
import MediaRow from '@/components/MediaRow';
import { Tv2 } from 'lucide-react';

export const metadata = { title: 'Anime — StreamVault' };

export default async function AnimePage() {
  const [popular, topRated, newAnime] = await Promise.all([
    getPopularAnime(),
    getTopRatedAnime(),
    getNewAnime(),
  ]);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center gap-3">
          <Tv2 className="w-6 h-6 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Anime</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">Japanese animation — handpicked by popularity and rating</p>
      </div>

      <MediaRow title="Popular Now" items={popular} mediaType="tv" />
      <MediaRow title="Top Rated" items={topRated} mediaType="tv" />
      <MediaRow title="Recently Released" items={newAnime} mediaType="tv" />
    </div>
  );
}
