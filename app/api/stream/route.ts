import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

async function tryMoviesApiClub(
  type: 'movie' | 'tv',
  id: number,
  season?: number,
  episode?: number,
): Promise<string | null> {
  try {
    const path =
      type === 'movie' ? `movie/${id}` : `tv/${id}-${season}-${episode}`;
    const res = await fetch(`https://moviesapi.club/${path}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://moviesapi.club/',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // moviesapi.club embeds JWPlayer config: {"file":"https://...m3u8",...}
    const m = html.match(/"file"\s*:\s*"(https?:[^"]+\.m3u8[^"]*)"/);
    return m ? m[1].replace(/\\/g, '') : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as 'movie' | 'tv' | null;
  const id = Number(searchParams.get('id'));
  const season = searchParams.has('season')
    ? Number(searchParams.get('season'))
    : undefined;
  const episode = searchParams.has('episode')
    ? Number(searchParams.get('episode'))
    : undefined;

  if (!type || !id) return NextResponse.json({ url: null });

  const url = await tryMoviesApiClub(type, id, season, episode);
  return NextResponse.json({ url });
}
