'use client';

import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { isInWatchlist, toggleWatchlist } from '@/lib/watchlist';
import { WatchlistItem } from '@/types';

interface Props {
  item: WatchlistItem;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WatchlistButton({ item, size = 'md', className = '' }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isInWatchlist(item.id, item.mediaType));
  }, [item.id, item.mediaType]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleWatchlist(item);
    setSaved(result);
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const btnSize = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : 'p-2';

  return (
    <button
      onClick={handleClick}
      title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`${btnSize} rounded-full transition-all duration-200 ${
        saved
          ? 'bg-accent text-white hover:bg-accent/80'
          : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
      } ${className}`}
    >
      {saved ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
    </button>
  );
}
