'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Props {
  mediaType: 'movie' | 'tv';
  id: number;
}

export default function StarRating({ mediaType, id }: Props) {
  const [rating, setRatingState] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    fetch(`/api/ratings?mediaId=${id}&mediaType=${mediaType}`)
      .then(r => r.json())
      .then(({ rating: r }) => setRatingState(r ?? null))
      .catch(() => {});
  }, [id, mediaType, session]);

  const handleRate = async (value: number) => {
    if (!session) { router.push('/login'); return; }

    if (rating === value) {
      setRatingState(null);
      await fetch('/api/ratings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: id, mediaType }),
      }).catch(() => setRatingState(value));
    } else {
      setRatingState(value);
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: id, mediaType, rating: value }),
      }).catch(() => setRatingState(null));
    }
  };

  const display = hover ?? rating ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 shrink-0">Your rating</span>
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const full = display >= star;
          const half = !full && display >= star - 0.5;

          return (
            <div key={star} className="relative w-5 h-5 cursor-pointer">
              <div
                className="absolute left-0 top-0 w-1/2 h-full z-10"
                onMouseEnter={() => setHover(star - 0.5)}
                onClick={() => handleRate(star - 0.5)}
              />
              <div
                className="absolute right-0 top-0 w-1/2 h-full z-10"
                onMouseEnter={() => setHover(star)}
                onClick={() => handleRate(star)}
              />

              {full ? (
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ) : half ? (
                <span className="relative block w-5 h-5">
                  <Star className="absolute inset-0 w-5 h-5 text-gray-600" />
                  <span className="absolute inset-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </span>
                </span>
              ) : (
                <Star className="w-5 h-5 text-gray-600" />
              )}
            </div>
          );
        })}
      </div>
      {rating != null && (
        <span className="text-xs text-yellow-400 font-medium">{rating}/5</span>
      )}
    </div>
  );
}
