const VIDKING_BASE = process.env.NEXT_PUBLIC_VIDKING_BASE ?? 'https://www.vidking.net/embed';

export type ServerId = 'vidking' | 'vidsrc' | 'embedsu';

export const SERVERS: { id: ServerId; label: string }[] = [
  { id: 'vidking', label: 'Vidking' },
  { id: 'vidsrc', label: 'VidSrc' },
  { id: 'embedsu', label: 'EmbedSu' },
];

export function buildServerUrl(
  serverId: ServerId,
  type: 'movie' | 'tv',
  id: number,
  season?: number,
  episode?: number
): string {
  if (type === 'movie') {
    switch (serverId) {
      case 'vidsrc': return `https://vidsrc.to/embed/movie/${id}`;
      case 'embedsu': return `https://embed.su/embed/movie/${id}`;
      default: return `${VIDKING_BASE}/movie/${id}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true`;
    }
  }
  switch (serverId) {
    case 'vidsrc': return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
    case 'embedsu': return `https://embed.su/embed/tv/${id}/${season}/${episode}`;
    default: return `${VIDKING_BASE}/tv/${id}/${season}/${episode}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true`;
  }
}
