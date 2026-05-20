'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import TrailerModal from './TrailerModal';

export default function TrailerButton({
  mediaType,
  id,
  title,
}: {
  mediaType: 'movie' | 'tv';
  id: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (fetched.current) return;
    fetched.current = true;
    fetch(`/api/trailer?type=${mediaType}&id=${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.key === 'string' || d?.key === null) setKey(d.key);
      })
      .catch(() => {
        // ignore
      });
  }, [open, mediaType, id]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sv-card-actions flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ring-1 ring-white/10"
        title="Watch trailer"
      >
        <Play className="w-4 h-4 fill-white" />
        Trailer
      </button>

      <TrailerModal open={open} title={title} youtubeKey={key} onClose={() => setOpen(false)} />
    </>
  );
}
