'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { getProgress, formatTime } from '@/lib/progress';

interface Props {
  mediaType: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
}

export default function ResumeButton({ mediaType, id, season, episode }: Props) {
  const [resumeTime, setResumeTime] = useState<string | null>(null);
  const [resumeSeason, setResumeSeason] = useState<number | undefined>();
  const [resumeEpisode, setResumeEpisode] = useState<number | undefined>();

  useEffect(() => {
    const prog = getProgress(mediaType, id);
    if (prog && prog.progress > 2 && prog.progress < 95) {
      setResumeTime(formatTime(prog.currentTime));
      setResumeSeason(prog.season);
      setResumeEpisode(prog.episode);
    }
  }, [mediaType, id]);

  if (!resumeTime) return null;

  const href =
    mediaType === 'tv' && resumeSeason && resumeEpisode
      ? `/tv/${id}/${resumeSeason}/${resumeEpisode}`
      : mediaType === 'movie'
      ? `/movie/${id}`
      : `/tv/${id}/${season}/${episode}`;

  const label =
    mediaType === 'tv' && resumeSeason && resumeEpisode
      ? `Resume S${resumeSeason}E${resumeEpisode} · ${resumeTime}`
      : `Resume · ${resumeTime}`;

  return (
    <Link
      href={href}
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/10"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}
