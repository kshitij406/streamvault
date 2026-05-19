'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, TVShow } from '@/types';
import MediaCard from './MediaCard';

interface Props {
  title: string;
  items: (Movie | TVShow)[];
  mediaType: 'movie' | 'tv';
}

export default function MediaRow({ title, items, mediaType }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className="mb-10 group/row">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2"
        >
          {items.map((item) => (
            <MediaCard key={item.id} item={item} mediaType={mediaType} />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>
    </section>
  );
}
