import { ProgressData } from '@/types';

export function progressKey(mediaType: 'movie' | 'tv', id: number): string {
  return `progress_${mediaType}_${id}`;
}

export function getProgress(
  mediaType: 'movie' | 'tv',
  id: number
): ProgressData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(progressKey(mediaType, id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProgress(
  mediaType: 'movie' | 'tv',
  id: number,
  data: Omit<ProgressData, 'updatedAt'>
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    progressKey(mediaType, id),
    JSON.stringify({ ...data, updatedAt: Date.now() })
  );
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
