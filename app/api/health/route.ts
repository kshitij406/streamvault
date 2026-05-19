import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // DB connectivity
  try {
    await sql`SELECT 1`;
    checks.db = 'ok';
  } catch (err) {
    checks.db = String(err);
  }

  // TMDB API
  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/configuration`,
      { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_TOKEN}` }, next: { revalidate: 0 } }
    );
    checks.tmdb = r.ok ? 'ok' : `status ${r.status}`;
  } catch (err) {
    checks.tmdb = String(err);
  }

  const allOk = Object.values(checks).every(v => v === 'ok');
  return NextResponse.json(
    { ok: allOk, checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 500 }
  );
}
