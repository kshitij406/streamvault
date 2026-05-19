const BASE = 'https://api.opensubtitles.com/api/v1';

export interface SubCue { start: number; end: number; text: string; }

function vttTimeToSeconds(t: string): number {
  const parts = t.trim().split(':').map(Number);
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}

function parseVTT(content: string): SubCue[] {
  const cues: SubCue[] = [];
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes(' --> ')) {
      const [startStr, endStr] = line.split(' --> ');
      const start = vttTimeToSeconds(startStr.split(' ')[0]);
      const end = vttTimeToSeconds(endStr.split(' ')[0]);
      const texts: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim()) {
        texts.push(lines[i].trim());
        i++;
      }
      const text = texts.join('\n').replace(/<[^>]+>/g, '');
      if (text) cues.push({ start, end, text });
    }
    i++;
  }
  return cues;
}

export async function fetchSubtitleCues(
  type: 'movie' | 'tv',
  id: number,
  season?: number,
  episode?: number
): Promise<SubCue[]> {
  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  if (!apiKey) return [];

  const headers: Record<string, string> = {
    'Api-Key': apiKey,
    'User-Agent': 'StreamVault v1.0',
    'Content-Type': 'application/json',
  };

  const qp = new URLSearchParams({ tmdb_id: String(id), languages: 'en', type });
  if (season !== undefined) qp.set('season_number', String(season));
  if (episode !== undefined) qp.set('episode_number', String(episode));

  try {
    const searchRes = await fetch(`${BASE}/subtitles?${qp}`, {
      headers,
      next: { revalidate: 86400 },
    });
    if (!searchRes.ok) return [];
    const { data } = await searchRes.json();
    if (!data?.length) return [];

    const best = [...data].sort(
      (a: Record<string, Record<string, number>>, b: Record<string, Record<string, number>>) =>
        (b.attributes?.download_count ?? 0) - (a.attributes?.download_count ?? 0)
    )[0];
    const fileId = (best?.attributes as Record<string, Array<Record<string, number>>>)?.files?.[0]?.file_id;
    if (!fileId) return [];

    const dlRes = await fetch(`${BASE}/download`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ file_id: fileId, sub_format: 'webvtt' }),
    });
    if (!dlRes.ok) return [];
    const { link } = await dlRes.json();
    if (!link) return [];

    const subRes = await fetch(link as string);
    if (!subRes.ok) return [];
    const text = await subRes.text();

    return parseVTT(text);
  } catch {
    return [];
  }
}
