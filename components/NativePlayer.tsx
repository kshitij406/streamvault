'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SubCue } from '@/lib/opensubtitles';

function fmt(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

interface Props {
  streamUrl: string;
  onFallback: () => void;
  mediaType: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
  title?: string;
  posterPath?: string | null;
  year?: string;
  genreIds?: number[];
  subtitleOffset: number;
}

export default function NativePlayer({
  streamUrl,
  onFallback,
  mediaType,
  id,
  season,
  episode,
  title,
  posterPath,
  year,
  genreIds,
  subtitleOffset,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const cuesRef = useRef<SubCue[]>([]);
  const lastSaved = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeCue, setActiveCue] = useState<SubCue | null>(null);
  const [qualities, setQualities] = useState<{ label: string; level: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState('Auto');

  // Init HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cleanup = () => {};

    (async () => {
      const HlsModule = await import('hls.js');
      const Hls = HlsModule.default;

      if (Hls.isSupported()) {
        const hls = new Hls({ startLevel: -1, debug: false });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const qs = data.levels.map((l, i) => ({
            label: l.height ? `${l.height}p` : `Level ${i + 1}`,
            level: i,
          }));
          setQualities(qs);
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            hls.destroy();
            hlsRef.current = null;
            onFallback();
          }
        });

        cleanup = () => {
          hls.destroy();
          hlsRef.current = null;
        };
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = streamUrl;
        video.play().catch(() => {});
        cleanup = () => {
          video.src = '';
        };
      } else {
        onFallback();
      }
    })();

    return () => cleanup();
  }, [streamUrl, onFallback]);

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setActiveCue(null);
    };
    const onDuration = () => setDuration(video.duration);
    const onVolume = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    const onTimeUpdate = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      if (video.buffered.length) {
        setBuffered(
          (video.buffered.end(video.buffered.length - 1) / (video.duration || 1)) * 100,
        );
      }
      const adj = t + subtitleOffset;
      const cue =
        cuesRef.current.find((c) => c.start <= adj && adj <= c.end) ?? null;
      setActiveCue((p) => (p?.start === cue?.start ? p : cue));

      const now = Date.now();
      if (now - lastSaved.current < 5000) return;
      lastSaved.current = now;
      if (title && video.duration) {
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
            currentTime: t,
            duration: video.duration,
            progress: (t / video.duration) * 100,
          }),
        }).catch(() => {});
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('volumechange', onVolume);
    video.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('volumechange', onVolume);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [id, mediaType, season, episode, title, posterPath, year, genreIds, subtitleOffset]);

  // Fetch subtitles
  useEffect(() => {
    cuesRef.current = [];
    setActiveCue(null);
    const params = new URLSearchParams({ type: mediaType, id: String(id) });
    if (season !== undefined) params.set('season', String(season));
    if (episode !== undefined) params.set('episode', String(episode));
    fetch(`/api/subtitles?${params}`)
      .then((r) => r.json())
      .then(({ cues }) => {
        cuesRef.current = cues ?? [];
      })
      .catch(() => {});
  }, [mediaType, id, season, episode]);

  // Fullscreen change
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const bumpControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
    bumpControls();
  }, [bumpControls]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  }, []);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const v = videoRef.current;
      if (!v || !v.duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
      bumpControls();
    },
    [bumpControls],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowRight':
          e.preventDefault();
          v.currentTime = Math.min(v.currentTime + 10, v.duration);
          bumpControls();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          v.currentTime = Math.max(v.currentTime - 10, 0);
          bumpControls();
          break;
        case 'ArrowUp':
          e.preventDefault();
          v.volume = Math.min(v.volume + 0.1, 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          v.volume = Math.max(v.volume - 0.1, 0);
          break;
        case 'm':
          v.muted = !v.muted;
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [togglePlay, toggleFullscreen, bumpControls]);

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl select-none"
      onMouseMove={bumpControls}
      onMouseEnter={bumpControls}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        playsInline
      />

      {/* Subtitle overlay */}
      {activeCue && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-10 px-4">
          <span className="bg-black/80 text-white text-sm sm:text-base px-3 py-1 rounded text-center max-w-[85%] leading-relaxed whitespace-pre-line">
            {activeCue.text}
          </span>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Progress bar */}
        <div
          className="relative z-10 w-full h-1.5 cursor-pointer group/bar"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          onClick={seek}
        >
          <div
            className="absolute inset-y-0 left-0 bg-white/30"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-[var(--accent,#e50914)]"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        {/* Bottom controls bar */}
        <div
          className="relative z-10 flex items-center gap-3 px-3 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-[var(--accent,#e50914)] transition-colors flex-shrink-0"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/vol">
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) v.muted = !v.muted;
              }}
              className="text-white hover:text-[var(--accent,#e50914)] transition-colors flex-shrink-0"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = videoRef.current;
                if (!v) return;
                const val = Number(e.target.value);
                v.volume = val;
                v.muted = val === 0;
              }}
              className="w-0 group-hover/vol:w-16 transition-[width] duration-200 h-1 accent-[var(--accent,#e50914)]"
            />
          </div>

          {/* Time */}
          <span className="text-white/80 text-xs tabular-nums flex-shrink-0">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex-1" />

          {/* Quality selector */}
          {qualities.length > 1 && (
            <div className="relative group/q">
              <button className="text-white/80 text-xs hover:text-white transition-colors">
                {currentQuality}
              </button>
              <div className="absolute bottom-full right-0 mb-1 bg-gray-900/95 border border-white/10 rounded-lg overflow-hidden z-50 min-w-[70px] opacity-0 pointer-events-none group-hover/q:opacity-100 group-hover/q:pointer-events-auto transition-opacity">
                <button
                  onClick={() => {
                    const h = hlsRef.current;
                    if (h) {
                      h.currentLevel = -1;
                      setCurrentQuality('Auto');
                    }
                  }}
                  className={`block w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${currentQuality === 'Auto' ? 'text-[var(--accent,#e50914)]' : 'text-white'}`}
                >
                  Auto
                </button>
                {qualities.map((q) => (
                  <button
                    key={q.level}
                    onClick={() => {
                      const h = hlsRef.current;
                      if (h) {
                        h.currentLevel = q.level;
                        setCurrentQuality(q.label);
                      }
                    }}
                    className={`block w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 transition-colors ${currentQuality === q.label ? 'text-[var(--accent,#e50914)]' : 'text-white'}`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-[var(--accent,#e50914)] transition-colors flex-shrink-0"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
