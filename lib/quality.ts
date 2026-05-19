const CAM_WINDOW_DAYS = 90;

export function getQualityTag(releaseDate: string | undefined | null): 'CAM' | 'HD' | null {
  if (!releaseDate) return null;
  const released = new Date(releaseDate).getTime();
  if (isNaN(released)) return null;
  const now = Date.now();
  if (released > now) return null;
  const daysSince = (now - released) / (1000 * 60 * 60 * 24);
  return daysSince < CAM_WINDOW_DAYS ? 'CAM' : 'HD';
}
