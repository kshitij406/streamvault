'use client';

import { useEffect, useRef } from 'react';
import { saveProgress } from '@/lib/progress';
import { addToHistory } from '@/lib/history';
import { getPlayerUrl } from '@/lib/tmdb';

interface Props {
  mediaType: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
  title?: string;
  posterPath?: string | null;
  year?: string;
  genreIds?: number[];
}

export default function Player({ mediaType, id, season, episode, title, posterPath, year, genreIds }: Props) {
  const src = getPlayerUrl(mediaType, id, season, episode);
  const lastSaved = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const original = window.open;
    window.open = () => null;
    return () => { window.open = original; };
  }, []);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;
          if (containerRef.current?.contains(node)) continue;
          const style = window.getComputedStyle(node);
          const zIndex = parseInt(style.zIndex, 10);
          if (style.position === 'fixed' || (!isNaN(zIndex) && zIndex > 9000)) {
            node.remove();
          }
        }
      }
    });
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'PLAYER_EVENT') return;
      const { event: evtName, currentTime, duration, progress } = e.data.data ?? {};

      if (!['timeupdate', 'pause', 'ended'].includes(evtName)) return;
      if (!currentTime || !duration) return;

      const now = Date.now();
      if (evtName === 'timeupdate' && now - lastSaved.current < 5000) return;
      lastSaved.current = now;

      const prog = progress ?? (currentTime / duration) * 100;

      saveProgress(mediaType, id, {
        currentTime,
        duration,
        progress: prog,
        ...(season !== undefined ? { season } : {}),
        ...(episode !== undefined ? { episode } : {}),
      });

      if (title) {
        addToHistory({
          id,
          mediaType,
          title,
          posterPath: posterPath ?? null,
          year: year ?? '',
          progress: prog,
          currentTime,
          duration,
          genreIds,
          ...(season !== undefined ? { season } : {}),
          ...(episode !== undefined ? { episode } : {}),
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mediaType, id, season, episode, title, posterPath, year, genreIds]);

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="origin"
        title={mediaType === 'movie' ? 'Movie Player' : `Episode S${season}E${episode}`}
        sandbox="allow-scripts allow-same-origin allow-fullscreen allow-presentation"
      />
    </div>
  );
}
