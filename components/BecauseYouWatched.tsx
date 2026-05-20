'use client';

import { useEffect, useMemo, useState } from 'react';
import { getLocalHistory } from '@/lib/localHistory';
import { getHistory } from '@/lib/history';
import MediaRow from './MediaRow';
import type { Movie, TVShow } from '@/types';
import { getDiscoverMovies, getDiscoverTV, getMovieRecommendations, getTVRecommendations } from '@/lib/tmdb';

export default function BecauseYouWatched({
  mediaTypeFilter,
}: {
  mediaTypeFilter?: 'movie' | 'tv';
}) {
  const [watchedTitle, setWatchedTitle] = useState('');
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');

  const seeds = useMemo(() => {
    const localAll = getLocalHistory();
    const local = mediaTypeFilter ? localAll.filter((h) => h.mediaType === mediaTypeFilter) : localAll;
    const cookie = (() => {
      try {
        return getHistory();
      } catch {
        return [];
      }
    })();

    const cookieFiltered = mediaTypeFilter
      ? cookie.filter((h) => h.mediaType === mediaTypeFilter)
      : cookie;

    const seedList: { mediaId: number; mediaType: 'movie' | 'tv'; title: string; genreIds?: number[] }[] = [];

    for (const h of local.slice(0, 3)) {
      seedList.push({ mediaId: h.mediaId, mediaType: h.mediaType, title: h.title, genreIds: h.genreIds });
    }
    for (const h of cookieFiltered.slice(0, 3)) {
      // Avoid duplicates by (mediaType,id)
      if (seedList.some((s) => s.mediaType === h.mediaType && s.mediaId === h.id)) continue;
      seedList.push({ mediaId: h.id, mediaType: h.mediaType, title: h.title, genreIds: h.genreIds });
    }

    return seedList.slice(0, 4);
  }, [mediaTypeFilter]);

  useEffect(() => {
    let cancelled = false;
    if (!seeds.length) return;

    const primary = seeds[0]!;

    const uniq = <T extends { id: number }>(list: T[]) => {
      const seen = new Set<number>();
      const out: T[] = [];
      for (const it of list) {
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        out.push(it);
      }
      return out;
    };

    const load = async () => {
      try {
        // Aggregate recommendations from multiple recent seeds.
        const recLists = await Promise.all(
          seeds.map(async (s) => {
            if (s.mediaType === 'movie') return getMovieRecommendations(s.mediaId);
            return getTVRecommendations(s.mediaId);
          }),
        );

        const combined = uniq(recLists.flat()).slice(0, 24);
        if (!cancelled && combined.length) {
          setItems(combined);
          setWatchedTitle(primary.title);
          setMediaType(primary.mediaType);
          return;
        }
      } catch {
        // fall through
      }

      // Fallback: genre-based discovery from recent history.
      try {
        const genreFreq: Record<number, number> = {};
        for (const s of seeds) {
          for (const g of s.genreIds ?? []) genreFreq[g] = (genreFreq[g] ?? 0) + 1;
        }
        const topGenres = Object.entries(genreFreq)
          .sort((a, b) => Number(b[1]) - Number(a[1]))
          .slice(0, 3)
          .map(([id]) => Number(id));

        if (!topGenres.length) return;

        const discovered =
          primary.mediaType === 'movie'
            ? await getDiscoverMovies(topGenres)
            : await getDiscoverTV(topGenres);

        if (!cancelled && discovered.length) {
          setItems(discovered.slice(0, 24));
          setWatchedTitle(primary.title);
          setMediaType(primary.mediaType);
        }
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [seeds]);

  if (!items.length) return null;

  return (
    <MediaRow
      title={`Because you watched ${watchedTitle}`}
      items={items}
      mediaType={mediaType}
    />
  );
}
