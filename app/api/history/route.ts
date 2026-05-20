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

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mediaId, mediaType, season, episode } = await req.json();
  const userId = session.user.id;

  await sql`
    DELETE FROM watch_history
    WHERE user_id = ${userId}
      AND media_id = ${mediaId}
      AND media_type = ${mediaType}
      AND (season IS NOT DISTINCT FROM ${season ?? null})
      AND (episode IS NOT DISTINCT FROM ${episode ?? null})
  `;

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mediaId, mediaType, title, posterPath, year, genreIds, season, episode, currentTime, duration, progress } = await req.json();
  const userId = session.user.id;

  // A progress save may arrive with "unknown" duration (providers without postMessages).
  // Don’t clobber a more precise DB entry with a worse one.
  const prev = await sql`
    SELECT current_time, duration, progress FROM watch_history
    WHERE user_id = ${userId}
      AND media_id = ${mediaId}
      AND media_type = ${mediaType}
      AND (season IS NOT DISTINCT FROM ${season ?? null})
      AND (episode IS NOT DISTINCT FROM ${episode ?? null})
    LIMIT 1
  `.catch(() => []);

  const prevRow = (prev as unknown as { current_time: number; duration: number; progress: number }[])[0];
  const prevDuration = prevRow?.duration ?? 0;
  const nextDuration = typeof duration === 'number' ? duration : 0;
  const nextCurrent = typeof currentTime === 'number' ? currentTime : 0;
  const nextProgress = typeof progress === 'number' ? progress : 0;

  // Reject regressions: if we already have duration and the next save doesn't,
  // and it's not clearly ahead, keep the old entry.
  if (prevRow && prevDuration > 0 && nextDuration <= 0) {
    const prevCurrent = prevRow.current_time ?? 0;
    const prevProgress = prevRow.progress ?? 0;
    const nextClearlyAhead = nextCurrent > prevCurrent + 45 || nextProgress > prevProgress + 2;
    if (!nextClearlyAhead) {
      return NextResponse.json({ success: true, ignored: true });
    }
  }

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
