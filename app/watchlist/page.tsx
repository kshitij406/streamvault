'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Bookmark, X, BookmarkX } from 'lucide-react';
import { WatchlistItem } from '@/types';
import { getWatchlist, toggleWatchlist } from '@/lib/watchlist';
import { getImageUrl } from '@/lib/tmdb';

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getWatchlist());
  }, []);

  const handleRemove = (item: WatchlistItem) => {
    toggleWatchlist(item);
    setItems(getWatchlist());
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-white/5 rounded w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-6 h-6 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Watchlist</h1>
          {items.length > 0 && (
            <span className="text-sm text-gray-500 ml-1">({items.length})</span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookmarkX className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">Your watchlist is empty</p>
            <p className="text-gray-600 text-sm mb-6">
              Save movies and shows to watch them later
            </p>
            <Link
              href="/"
              className="bg-accent hover:bg-accent/80 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <WatchlistCard key={`${item.mediaType}-${item.id}`} item={item} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WatchlistCard({
  item,
  onRemove,
}: {
  item: WatchlistItem;
  onRemove: (item: WatchlistItem) => void;
}) {
  const poster = getImageUrl(item.posterPath, 'w342');
  const href = `/${item.mediaType}/${item.id}`;

  return (
    <div className="group relative">
      <Link href={href} className="block">
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card mb-2">
          {poster ? (
            <Image
              src={poster}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center px-2">
              {item.title}
            </div>
          )}

          <div className="absolute top-2 left-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                item.mediaType === 'movie'
                  ? 'bg-blue-600/80 text-white'
                  : 'bg-purple-600/80 text-white'
              }`}
            >
              {item.mediaType === 'movie' ? 'Movie' : 'TV'}
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <p className="text-xs font-medium text-gray-200 truncate">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-500">{item.year}</span>
          {item.rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-400">{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>

      <button
        onClick={() => onRemove(item)}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-gray-300 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove from watchlist"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
