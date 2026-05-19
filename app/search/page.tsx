'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Star, Loader2 } from 'lucide-react';
import { MediaItem, Movie, TVShow } from '@/types';
import { getImageUrl } from '@/lib/tmdb';
import WatchlistButton from '@/components/WatchlistButton';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(q)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}`,
          },
        }
      );
      const data = await res.json();
      setResults(
        (data.results as MediaItem[]).filter(
          (item) => item.media_type === 'movie' || item.media_type === 'tv'
        )
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Search</h1>

        <div className="relative mb-8 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies and TV shows..."
            autoFocus
            className="w-full bg-card border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {query && !loading && results.length === 0 && (
          <p className="text-gray-500 text-center py-12">No results found for &quot;{query}&quot;</p>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((item) => (
              <SearchCard key={`${item.media_type}-${item.id}`} item={item} />
            ))}
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-500">Start typing to search for movies and TV shows</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchCard({ item }: { item: MediaItem }) {
  const isMovie = item.media_type === 'movie';
  const movie = item as Movie & { media_type: 'movie' };
  const tv = item as TVShow & { media_type: 'tv' };

  const title = isMovie ? movie.title : tv.name;
  const year = isMovie
    ? movie.release_date?.slice(0, 4)
    : tv.first_air_date?.slice(0, 4);
  const poster = getImageUrl(item.poster_path, 'w342');
  const href = `/${item.media_type}/${item.id}`;

  const watchlistItem = {
    id: item.id,
    mediaType: item.media_type,
    title,
    posterPath: item.poster_path,
    year: year ?? '',
    rating: item.vote_average,
    addedAt: 0,
  };

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-card mb-2">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center px-2">
            {title}
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isMovie
                ? 'bg-blue-600/80 text-white'
                : 'bg-purple-600/80 text-white'
            }`}
          >
            {isMovie ? 'Movie' : 'TV'}
          </span>
        </div>

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <WatchlistButton item={watchlistItem} size="sm" />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <p className="text-xs font-medium text-gray-200 truncate">{title}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-xs text-gray-500">{year}</span>
        {item.vote_average > 0 && (
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-400">{item.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
