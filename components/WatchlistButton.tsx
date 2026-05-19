'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { WatchlistItem } from '@/types';

interface Props {
  item: WatchlistItem;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function WatchlistButton({ item, size = 'md', className = '' }: Props) {
  const [saved, setSaved] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    fetch(`/api/watchlist?mediaId=${item.id}&mediaType=${item.mediaType}`)
      .then(r => r.json())
      .then(({ saved: s }) => { if (typeof s === 'boolean') setSaved(s); })
      .catch(() => {});
  }, [item.id, item.mediaType, session]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push('/login');
      return;
    }
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (typeof data.saved === 'boolean') setSaved(data.saved);
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
