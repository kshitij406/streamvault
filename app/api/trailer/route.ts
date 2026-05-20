import { NextRequest, NextResponse } from 'next/server';
import { getMovieTrailerKey, getTVTrailerKey } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const id = Number(url.searchParams.get('id'));

  if ((type !== 'movie' && type !== 'tv') || !Number.isFinite(id)) {
    return NextResponse.json({ key: null }, { status: 400 });
  }

  try {
    const key = type === 'movie' ? await getMovieTrailerKey(id) : await getTVTrailerKey(id);
    return NextResponse.json({ key });
  } catch {
    return NextResponse.json({ key: null }, { status: 200 });
  }
}
