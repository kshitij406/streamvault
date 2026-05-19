import { NextResponse } from 'next/server';

// Auth is optional — all routes are publicly accessible.
// Login/signup are available but not required.
export function middleware() {
  return NextResponse.next();
}

export const config = { matcher: [] };
