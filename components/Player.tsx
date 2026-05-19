'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SERVERS, buildServerUrl, type ServerId } from '@/lib/servers';
import type { SubCue } from '@/lib/opensubtitles';

const SERVER_IDS = SERVERS.map(s => s.id) as ServerId[];

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
  const lastEventAt = useRef(0);
  const noSignalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cuesRef = useRef<SubCue[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerId>('vidking');
  const [activeCue, setActiveCue] = useState<SubCue | null>(null);
  const [subtitleOffset, setSubtitleOffset] = useState(0);
  const [noSignal, setNoSignal] = useState(false);

  const src = buildServerUrl(selectedServer, mediaType, id, season, episode);

  // Try next server automatically if no player events after 20s
  const tryNextServer = useCallback(() => {
    setSelectedServer(current => {
      const idx = SERVER_IDS.indexOf(current);
      const next = SERVER_IDS[(idx + 1) % SERVER_IDS.length];
      return next;
    });
    setNoSignal(false);
  }, []);

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

  // Reset no-signal state and start 20s timer when server changes
  useEffect(() => {
    setNoSignal(false);
    lastEventAt.current = 0;
    if (noSignalTimer.current) clearTimeout(noSignalTimer.current);

    // Only watch for signal on Vidking (only server that sends postMessage)
    if (selectedServer === 'vidking') {
      noSignalTimer.current = setTimeout(() => {
        if (lastEventAt.current === 0) setNoSignal(true);
      }, 20000);
    }

    return () => {
      if (noSignalTimer.current) clearTimeout(noSignalTimer.current);
    };
  }, [selectedServer, src]);

  // Fetch subtitles
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
      const { event: evtName, currentTime: rawTime, duration, progress } = e.data.data ?? {};

      if (!['timeupdate', 'pause', 'ended'].includes(evtName)) return;
      if (!rawTime || !duration) return;

      // Signal received — clear no-signal state
      lastEventAt.current = Date.now();
      setNoSignal(false);

      const currentTime = rawTime + subtitleOffset;

      if (evtName === 'timeupdate') {
        const cue = cuesRef.current.find(c => c.start <= currentTime && currentTime <= c.end) ?? null;
        setActiveCue(prev => (prev?.start === cue?.start ? prev : cue));
      } else {
        setActiveCue(null);
      }

      const now = Date.now();
      if (evtName === 'timeupdate' && now - lastSaved.current < 5000) return;
      lastSaved.current = now;

      const prog = progress ?? (rawTime / duration) * 100;

      if (title) {
        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId: id, mediaType, title,
            posterPath: posterPath ?? null,
            year: year ?? '',
            genreIds,
            season: season ?? null,
            episode: episode ?? null,
            currentTime: rawTime,
            duration,
            progress: prog,
          }),
        }).catch(() => {});
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mediaType, id, season, episode, title, posterPath, year, genreIds, subtitleOffset]);

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
        {noSignal && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-20">
            <p className="text-white text-sm font-medium">Stream not responding on {SERVERS.find(s => s.id === selectedServer)?.label}</p>
            <button
              onClick={tryNextServer}
              className="bg-accent hover:bg-accent/80 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Try next server
            </button>
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

        <span className="text-xs text-gray-500 ml-2">Sub offset:</span>
        <button
          onClick={() => setSubtitleOffset(o => Math.round((o - 0.5) * 10) / 10)}
          className="text-xs px-2 py-1 rounded-lg border bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
        >
          −0.5s
        </button>
        <span className="text-xs text-gray-300 min-w-[3rem] text-center">
          {subtitleOffset > 0 ? `+${subtitleOffset}s` : subtitleOffset === 0 ? '0s' : `${subtitleOffset}s`}
        </span>
        <button
          onClick={() => setSubtitleOffset(o => Math.round((o + 0.5) * 10) / 10)}
          className="text-xs px-2 py-1 rounded-lg border bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
        >
          +0.5s
        </button>
        {subtitleOffset !== 0 && (
          <button
            onClick={() => setSubtitleOffset(0)}
            className="text-xs px-2 py-1 rounded-lg border bg-white/5 text-gray-500 border-white/10 hover:text-white hover:bg-white/10"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
