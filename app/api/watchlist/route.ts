import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [], saved: false });

  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');
  const mediaType = searchParams.get('mediaType');

  if (mediaId && mediaType) {
    const rows = await sql`
      SELECT id FROM watchlist
      WHERE user_id = ${session.user.id} AND media_id = ${Number(mediaId)} AND media_type = ${mediaType}
    `;
    return NextResponse.json({ saved: rows.length > 0 });
  }

  const rows = await sql`
    SELECT * FROM watchlist WHERE user_id = ${session.user.id} ORDER BY added_at DESC
  `;
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: mediaId, mediaType, title, posterPath, year, rating, genreIds } = await req.json();
  const userId = session.user.id;

  const existing = await sql`
    SELECT id FROM watchlist
    WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}
  `;

  if (existing.length > 0) {
    await sql`DELETE FROM watchlist WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}`;
    return NextResponse.json({ saved: false });
  }

  await sql`
    INSERT INTO watchlist (user_id, media_id, media_type, title, poster_path, year, rating, genre_ids)
    VALUES (${userId}, ${mediaId}, ${mediaType}, ${title}, ${posterPath ?? null}, ${year ?? ''}, ${rating ?? 0}, ${genreIds ?? []})
  `;
  return NextResponse.json({ saved: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: mediaId, mediaType } = await req.json();
  await sql`
    DELETE FROM watchlist WHERE user_id = ${session.user.id} AND media_id = ${mediaId} AND media_type = ${mediaType}
  `;
  return NextResponse.json({ success: true });
}
