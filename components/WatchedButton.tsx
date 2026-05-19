'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { isWatched, toggleWatched } from '@/lib/ratings';

interface Props {
  mediaType: 'movie' | 'tv';
  id: number;
}

export default function WatchedButton({ mediaType, id }: Props) {
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setWatched(isWatched(mediaType, id));
  }, [mediaType, id]);

  const toggle = () => {
    const result = toggleWatched(mediaType, id);
    setWatched(result);
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
