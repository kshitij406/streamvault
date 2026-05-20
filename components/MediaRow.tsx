'use client';

import { useRef, useCallback } from 'react';
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

  // D-pad / keyboard navigation: left/right arrows move focus between cards
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!rowRef.current) return;

    const cards = Array.from(
      rowRef.current.querySelectorAll<HTMLElement>('a[tabindex="0"]')
    );
    const idx = cards.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;

    e.preventDefault();
    const next = e.key === 'ArrowRight' ? cards[idx + 1] : cards[idx - 1];
    if (next) {
      next.focus();
      next.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  if (!items.length) return null;

  return (
    <section className="mb-10 group/row" onKeyDown={handleKeyDown} data-tv-row>
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-3">
        <h2 className="row-title text-base sm:text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="relative sv-row-mask">
        <button
          onClick={() => scroll('left')}
          tabIndex={-1}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll left"
        >
          <div className="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </div>
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
          tabIndex={-1}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Scroll right"
        >
          <div className="w-9 h-9 rounded-full bg-black/35 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>
    </section>
  );
}
