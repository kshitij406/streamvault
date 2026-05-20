'use client';

import { useEffect, useRef, useState } from 'react';
import { SERVERS, buildServerUrl, type ServerId } from '@/lib/servers';
import type { SubCue } from '@/lib/opensubtitles';
import { upsertLocalHistory } from '@/lib/localHistory';

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

export default function Player({
  mediaType,
  id,
  season,
  episode,
  title,
  posterPath,
  year,
  genreIds,
}: Props) {
  const lastSaved = useRef(0);
  // true once any valid player postMessage has been received
  const gotPostMessage = useRef(false);
  const cuesRef = useRef<SubCue[]>([]);

  const [selectedServer, setSelectedServer] = useState<ServerId>('vidking');
  const [activeCue, setActiveCue] = useState<SubCue | null>(null);
  const [subtitleOffset, setSubtitleOffset] = useState(0);

  const src = buildServerUrl(selectedServer, mediaType, id, season, episode);

  // Reset postMessage flag when content changes
  useEffect(() => {
    gotPostMessage.current = false;
  }, [id, mediaType, season, episode]);

  // Time-based fallback: if no postMessages arrive within 30s, still save to
  // localStorage so the item appears in Continue Watching
  useEffect(() => {
    if (!title) return;
    const timer = setTimeout(() => {
      if (gotPostMessage.current) return; // postMessages working, skip
      upsertLocalHistory({
        mediaId: id,
        mediaType,
        title,
        posterPath: posterPath ?? null,
        progress: 5,
        currentTime: 0,
        duration: 0,
        season: season ?? null,
        episode: episode ?? null,
        genreIds: genreIds ?? [],
      });
    }, 30_000);
    return () => clearTimeout(timer);
  }, [id, mediaType, season, episode, title, posterPath, genreIds]);

  // Fetch subtitles (Vidking only)
  useEffect(() => {
    cuesRef.current = [];
    setActiveCue(null);
    if (selectedServer !== 'vidking') return;

    const params = new URLSearchParams({ type: mediaType, id: String(id) });
    if (season !== undefined) params.set('season', String(season));
    if (episode !== undefined) params.set('episode', String(episode));

    fetch(`/api/subtitles?${params}`)
      .then((r) => r.json())
      .then(({ cues }) => {
        cuesRef.current = cues ?? [];
      })
      .catch(() => {});
  }, [mediaType, id, season, episode, selectedServer]);

  // PostMessage handler — tries multiple embed player event shapes
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;

      let evtName: string | undefined;
      let rawTime: number | undefined;
      let dur: number | undefined;
      let prog: number | undefined;

      const d = e.data;

      if (d.type === 'PLAYER_EVENT' && d.data) {
        // Vidking original format
        evtName = d.data.event;
        rawTime = d.data.currentTime;
        dur = d.data.duration;
        prog = d.data.progress;
      } else if (typeof d.type === 'string' && typeof d.currentTime === 'number') {
        // { type: 'timeupdate', currentTime, duration }
        evtName = d.type;
        rawTime = d.currentTime;
        dur = d.duration;
        prog = d.progress;
      } else if (typeof d.event === 'string' && typeof d.currentTime === 'number') {
        // { event: 'timeupdate', currentTime, duration }
        evtName = d.event;
        rawTime = d.currentTime;
        dur = d.duration;
        prog = d.progress;
      }

      if (!evtName || !['timeupdate', 'pause', 'ended', 'playing'].includes(evtName)) return;
      if (!rawTime || !dur) return;

      gotPostMessage.current = true;

      const currentTime = rawTime + subtitleOffset;

      if (evtName === 'timeupdate') {
        const cue =
          cuesRef.current.find((c) => c.start <= currentTime && currentTime <= c.end) ?? null;
        setActiveCue((prev) => (prev?.start === cue?.start ? prev : cue));
      } else {
        setActiveCue(null);
      }

      const now = Date.now();
      if (evtName === 'timeupdate' && now - lastSaved.current < 5000) return;
      lastSaved.current = now;

      const progress = prog ?? (rawTime / dur) * 100;

      if (title) {
        upsertLocalHistory({
          mediaId: id,
          mediaType,
          title,
          posterPath: posterPath ?? null,
          progress,
          currentTime: rawTime,
          duration: dur,
          season: season ?? null,
          episode: episode ?? null,
          genreIds: genreIds ?? [],
        });

        fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaId: id,
            mediaType,
            title,
            posterPath: posterPath ?? null,
            year: year ?? '',
            genreIds,
            season: season ?? null,
            episode: episode ?? null,
            currentTime: rawTime,
            duration: dur,
            progress,
          }),
        }).catch(() => {});
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mediaType, id, season, episode, title, posterPath, year, genreIds, subtitleOffset]);

  return (
    <div>
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
          title={
            mediaType === 'movie'
              ? 'Movie Player'
              : `Episode S${season}E${episode}`
          }
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
        {SERVERS.map((s) => (
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
          onClick={() => setSubtitleOffset((o) => Math.round((o - 0.5) * 10) / 10)}
          className="text-xs px-2 py-1 rounded-lg border bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
        >
          −0.5s
        </button>
        <span className="text-xs text-gray-300 min-w-[3rem] text-center">
          {subtitleOffset > 0
            ? `+${subtitleOffset}s`
            : subtitleOffset === 0
              ? '0s'
              : `${subtitleOffset}s`}
        </span>
        <button
          onClick={() => setSubtitleOffset((o) => Math.round((o + 0.5) * 10) / 10)}
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
