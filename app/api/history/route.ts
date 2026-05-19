import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ history: [] });

  const inProgress = new URL(req.url).searchParams.get('in_progress') === 'true';

  const rows = inProgress
    ? await sql`
        SELECT * FROM watch_history
        WHERE user_id = ${session.user.id} AND progress >= 2 AND progress <= 95
        ORDER BY last_watched DESC LIMIT 20
      `
    : await sql`
        SELECT * FROM watch_history
        WHERE user_id = ${session.user.id}
        ORDER BY last_watched DESC LIMIT 50
      `;

  return NextResponse.json({ history: rows });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mediaId, mediaType, title, posterPath, year, genreIds, season, episode, currentTime, duration, progress } = await req.json();
  const userId = session.user.id;

  await sql`
    DELETE FROM watch_history
    WHERE user_id = ${userId}
      AND media_id = ${mediaId}
      AND media_type = ${mediaType}
      AND (season IS NOT DISTINCT FROM ${season ?? null})
      AND (episode IS NOT DISTINCT FROM ${episode ?? null})
  `;

  await sql`
    INSERT INTO watch_history
      (user_id, media_id, media_type, title, poster_path, year, genre_ids, season, episode, current_time, duration, progress)
    VALUES
      (${userId}, ${mediaId}, ${mediaType}, ${title}, ${posterPath ?? null}, ${year ?? ''},
       ${genreIds ?? []}, ${season ?? null}, ${episode ?? null},
       ${currentTime}, ${duration}, ${progress})
  `;

  return NextResponse.json({ success: true });
}
