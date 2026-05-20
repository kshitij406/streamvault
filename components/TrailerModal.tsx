'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function TrailerModal({
  open,
  title,
  youtubeKey,
  onClose,
}: {
  open: boolean;
  title: string;
  youtubeKey: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    // Prevent background scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const src = youtubeKey
    ? `https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} trailer` : 'Trailer'}
      className="fixed inset-0 z-[60]"
    >
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close trailer"
      />

      <div className="absolute left-1/2 top-1/2 w-[min(920px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10">
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{title}</p>
              <p className="text-xs text-gray-400">Trailer</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative aspect-video bg-black">
            {src ? (
              <iframe
                src={src}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="origin"
                title={title ? `${title} trailer` : 'Trailer'}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Trailer unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
