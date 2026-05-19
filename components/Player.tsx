'use client';

import { useEffect, useRef, useState } from 'react';
import { saveProgress } from '@/lib/progress';
import { addToHistory } from '@/lib/history';
import { SERVERS, buildServerUrl, type ServerId } from '@/lib/servers';
import type { SubCue } from '@/lib/opensubtitles';

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
  const lastSaved = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cuesRef = useRef<SubCue[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerId>('vidking');
  const [activeCue, setActiveCue] = useState<SubCue | null>(null);

  const src = buildServerUrl(selectedServer, mediaType, id, season, episode);

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

  // Fetch subtitles — only meaningful on Vidking since other servers send no postMessage events
  useEffect(() => {
    cuesRef.current = [];
    setActiveCue(null);
    if (selectedServer !== 'vidking') return;

    const params = new URLSearchParams({ type: mediaType, id: String(id) });
    if (season !== undefined) params.set('season', String(season));
    if (episode !== undefined) params.set('episode', String(episode));

    fetch(`/api/subtitles?${params}`)
      .then(r => r.json())
      .then(({ cues }) => { cuesRef.current = cues ?? []; })
      .catch(() => {});
  }, [mediaType, id, season, episode, selectedServer]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || e.data.type !== 'PLAYER_EVENT') return;
      const { event: evtName, currentTime, duration, progress } = e.data.data ?? {};

      if (!['timeupdate', 'pause', 'ended'].includes(evtName)) return;
      if (!currentTime || !duration) return;

      // Sync subtitle cue on every timeupdate
      if (evtName === 'timeupdate') {
        const cue = cuesRef.current.find(c => c.start <= currentTime && currentTime <= c.end) ?? null;
        setActiveCue(prev => (prev?.start === cue?.start ? prev : cue));
      } else {
        setActiveCue(null);
      }

      // Throttled progress + history save
      const now = Date.now();
      if (evtName === 'timeupdate' && now - lastSaved.current < 5000) return;
      lastSaved.current = now;

      const prog = progress ?? (currentTime / duration) * 100;
      saveProgress(mediaType, id, {
        currentTime, duration, progress: prog,
        ...(season !== undefined ? { season } : {}),
        ...(episode !== undefined ? { episode } : {}),
      });

      if (title) {
        addToHistory({
          id, mediaType, title,
          posterPath: posterPath ?? null,
          year: year ?? '',
          progress: prog, currentTime, duration, genreIds,
          ...(season !== undefined ? { season } : {}),
          ...(episode !== undefined ? { episode } : {}),
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mediaType, id, season, episode, title, posterPath, year, genreIds]);

  return (
    <div>
      <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
          title={mediaType === 'movie' ? 'Movie Player' : `Episode S${season}E${episode}`}
        />
        {activeCue && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-10 px-4">
            <span className="bg-black/80 text-white text-sm sm:text-base px-3 py-1 rounded text-center max-w-[85%] leading-relaxed whitespace-pre-line">
              {activeCue.text}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span className="text-xs text-gray-500">Server:</span>
        {SERVERS.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedServer(s.id)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
              selectedServer === s.id
                ? 'bg-accent text-white border-accent'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
