import { fetchSubtitleCues } from '@/lib/opensubtitles';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') ?? 'movie') as 'movie' | 'tv';
  const id = Number(searchParams.get('id'));
  const seasonParam = searchParams.get('season');
  const episodeParam = searchParams.get('episode');
  const season = seasonParam !== null ? Number(seasonParam) : undefined;
  const episode = episodeParam !== null ? Number(episodeParam) : undefined;

  if (!id) return Response.json({ cues: [] });

  const cues = await fetchSubtitleCues(type, id, season, episode);
  return Response.json({ cues });
}
