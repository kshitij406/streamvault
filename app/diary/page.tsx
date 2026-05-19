'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, BookOpen, Eye, Clock } from 'lucide-react';
import { getImageUrl } from '@/lib/tmdb';

interface DiaryEntry {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year: string;
  progress: number;
  lastWatched: number;
  season?: number;
  episode?: number;
  userRating: number | null;
  markedWatched: boolean;
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => {
        const full = rating >= s;
        const half = !full && rating >= s - 0.5;
        return (
          <span key={s} className="relative inline-block w-4 h-4">
            {full ? (
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ) : half ? (
              <>
                <Star className="absolute inset-0 w-4 h-4 text-gray-600" />
                <span className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </span>
              </>
            ) : (
              <Star className="w-4 h-4 text-gray-600" />
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch('/api/history').then(r => r.json()),
      fetch('/api/ratings').then(r => r.json()),
    ]).then(([{ history }, { ratings }]) => {
      const ratingMap: Record<string, { rating: number | null; watched: boolean }> = {};
      for (const r of ratings ?? []) {
        ratingMap[`${r.media_type}_${r.media_id}`] = { rating: r.rating, watched: r.watched };
      }
      const enriched: DiaryEntry[] = (history ?? []).map((h: Record<string, unknown>) => {
        const key = `${h.media_type}_${h.media_id}`;
        return {
          id: h.media_id as number,
          mediaType: h.media_type as 'movie' | 'tv',
          title: h.title as string,
          posterPath: (h.poster_path as string) ?? null,
          year: (h.year as string) ?? '',
          progress: h.progress as number,
          lastWatched: h.last_watched ? new Date(h.last_watched as string).getTime() : 0,
          season: (h.season as number | null) ?? undefined,
          episode: (h.episode as number | null) ?? undefined,
          userRating: ratingMap[key]?.rating ?? null,
          markedWatched: ratingMap[key]?.watched ?? false,
        };
      });
      setEntries(enriched);
    }).catch(() => {});
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 bg-white/5 rounded w-40 mb-8 animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 mb-6 animate-pulse">
              <div className="w-12 aspect-[2/3] rounded bg-white/5 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-6 h-6 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Diary</h1>
          {entries.length > 0 && (
            <span className="text-sm text-gray-500">({entries.length} entries)</span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="w-12 h-12 text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">Your diary is empty</p>
            <p className="text-gray-600 text-sm mb-6">Start watching movies and shows to build your diary</p>
            <Link
              href="/"
              className="bg-accent hover:bg-accent/80 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const href = entry.mediaType === 'movie' ? `/movie/${entry.id}` : `/tv/${entry.id}`;
              const poster = getImageUrl(entry.posterPath, 'w154');
              const badge = entry.mediaType === 'movie' ? 'bg-blue-600/80' : 'bg-purple-600/80';

              return (
                <div
                  key={`${entry.mediaType}-${entry.id}`}
                  className="flex gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-xl p-3 transition-colors group"
                >
                  <Link href={href} className="flex-shrink-0">
                    <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden bg-card">
                      {poster ? (
                        <Image
                          src={poster}
                          alt={entry.title}
                          fill
                          sizes="48px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-card" />
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={href}>
                          <h3 className="text-sm font-semibold text-white truncate hover:text-accent transition-colors">
                            {entry.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500">{entry.year}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white ${badge}`}>
                            {entry.mediaType === 'movie' ? 'Film' : 'TV'}
                          </span>
                          {entry.mediaType === 'tv' && entry.season != null && entry.episode != null && (
                            <span className="text-xs text-gray-500">S{entry.season}E{entry.episode}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">{relativeDate(entry.lastWatched)}</span>
                        {entry.markedWatched && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Eye className="w-3 h-3" />
                            Watched
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {entry.userRating != null ? (
                        <div className="flex items-center gap-1.5">
                          <StarDisplay rating={entry.userRating} />
                          <span className="text-xs text-yellow-400 font-medium">{entry.userRating}/5</span>
                        </div>
                      ) : (
                        <Link href={href} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                          Rate this →
                        </Link>
                      )}
                      {entry.progress > 0 && entry.progress < 100 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {Math.round(entry.progress)}% watched
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
