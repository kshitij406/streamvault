'use client';

import { useEffect, useRef } from 'react';
import { saveProgress } from '@/lib/progress';
import { getPlayerUrl } from '@/lib/tmdb';

interface Props {
  mediaType: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
}

export default function Player({ mediaType, id, season, episode }: Props) {
  const src = getPlayerUrl(mediaType, id, season, episode);
  const lastSaved = useRef(0);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'PLAYER_EVENT') return;
      const { event: evtName, currentTime, duration, progress } = e.data.data ?? {};

      if (!['timeupdate', 'pause', 'ended'].includes(evtName)) return;
      if (!currentTime || !duration) return;

      const now = Date.now();
      if (evtName === 'timeupdate' && now - lastSaved.current < 5000) return;
      lastSaved.current = now;

      saveProgress(mediaType, id, {
        currentTime,
        duration,
        progress: progress ?? (currentTime / duration) * 100,
        ...(season !== undefined ? { season } : {}),
        ...(episode !== undefined ? { episode } : {}),
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mediaType, id, season, episode]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="origin"
        title={mediaType === 'movie' ? 'Movie Player' : `Episode S${season}E${episode}`}
      />
    </div>
  );
}
