'use client';

import { useEffect, useState } from 'react';
import { getLocalHistory } from '@/lib/localHistory';
import MediaRow from './MediaRow';
import type { Movie, TVShow } from '@/types';

export default function BecauseYouWatched() {
  const [watchedTitle, setWatchedTitle] = useState('');
  const [items, setItems] = useState<(Movie | TVShow)[]>([]);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');

  useEffect(() => {
    const history = getLocalHistory();
    if (!history.length) return;

    const latest = history[0];
    const url =
      latest.mediaType === 'movie'
        ? `https://api.themoviedb.org/3/movie/${latest.mediaId}/recommendations?language=en-US&page=1`
        : `https://api.themoviedb.org/3/tv/${latest.mediaId}/recommendations?language=en-US&page=1`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.results?.length) {
          setItems(data.results.slice(0, 20));
          setWatchedTitle(latest.title);
          setMediaType(latest.mediaType);
        }
      })
      .catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <MediaRow
      title={`Because you watched ${watchedTitle}`}
      items={items}
      mediaType={mediaType}
    />
  );
}
