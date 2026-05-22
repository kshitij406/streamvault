'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import useSafeSession from '@/lib/useSafeSession';

interface Props {
  mediaType: 'movie' | 'tv';
  id: number;
}

export default function WatchedButton({ mediaType, id }: Props) {
  const [watched, setWatched] = useState(false);
  const session = useSafeSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    fetch(`/api/ratings?mediaId=${id}&mediaType=${mediaType}`)
      .then(r => r.json())
      .then(({ watched: w }) => { if (typeof w === 'boolean') setWatched(w); })
      .catch(() => {});
  }, [id, mediaType, session]);

  const toggle = async () => {
    if (!session) { router.push('/login'); return; }
    const next = !watched;
    setWatched(next);
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId: id, mediaType, watched: next }),
    }).catch(() => setWatched(!next));
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
        watched
          ? 'bg-green-900/40 text-green-400 border-green-800 hover:bg-green-900/60'
          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
      }`}
    >
      {watched ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      {watched ? 'Watched' : 'Mark Watched'}
    </button>
  );
}
