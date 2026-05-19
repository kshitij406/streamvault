import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ rating: null, watched: false });

  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');
  const mediaType = searchParams.get('mediaType');

  if (!mediaId || !mediaType) {
    const rows = await sql`SELECT * FROM user_ratings WHERE user_id = ${session.user.id}`;
    return NextResponse.json({ ratings: rows });
  }

  const rows = await sql`
    SELECT rating, watched FROM user_ratings
    WHERE user_id = ${session.user.id} AND media_id = ${Number(mediaId)} AND media_type = ${mediaType}
  `;
  const row = rows[0] as { rating: number | null; watched: boolean } | undefined;
  return NextResponse.json({ rating: row?.rating ?? null, watched: row?.watched ?? false });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mediaId, mediaType, rating, watched } = await req.json();
  const userId = session.user.id;

  await sql`
    INSERT INTO user_ratings (user_id, media_id, media_type, rating, watched)
    VALUES (${userId}, ${mediaId}, ${mediaType}, ${rating ?? null}, ${watched ?? false})
    ON CONFLICT (user_id, media_id, media_type) DO UPDATE SET
      rating = COALESCE(EXCLUDED.rating, user_ratings.rating),
      watched = COALESCE(EXCLUDED.watched, user_ratings.watched),
      updated_at = NOW()
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { mediaId, mediaType } = await req.json();
  await sql`
    DELETE FROM user_ratings
    WHERE user_id = ${session.user.id} AND media_id = ${mediaId} AND media_type = ${mediaType}
  `;
  return NextResponse.json({ success: true });
}
