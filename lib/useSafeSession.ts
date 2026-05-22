/*
 * next-auth's `useSession()` expects a `SessionProvider` in the tree.
 * In this repo we intentionally fall back to rendering without the provider
 * in some environments (see `components/SessionProvider`). In that case
 * `useSession()` can be `undefined` at runtime, so callers must be defensive.
 */

'use client';

import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

export default function useSafeSession(): Session | null {
  try {
    const res = useSession();
    return res?.data ?? null;
  } catch {
    // If next-auth throws because there is no provider in the tree,
    // treat it as unauthenticated.
    return null;
  }
}
