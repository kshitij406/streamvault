import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS watch_history (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      year TEXT DEFAULT '',
      genre_ids INTEGER[] DEFAULT '{}',
      season INTEGER,
      episode INTEGER,
      current_time REAL DEFAULT 0,
      duration REAL DEFAULT 0,
      progress REAL DEFAULT 0,
      last_watched TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      year TEXT DEFAULT '',
      rating REAL DEFAULT 0,
      genre_ids INTEGER[] DEFAULT '{}',
      added_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, media_id, media_type)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_ratings (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL,
      rating REAL,
      watched BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(user_id, media_id, media_type)
    )
  `;

  return NextResponse.json({ ok: true, message: 'Tables created' });
}
