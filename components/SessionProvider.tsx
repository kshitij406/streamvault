'use client';

import { Component, type ReactNode } from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface State { crashed: boolean }

class SessionBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { crashed: false };
  static getDerivedStateFromError(): State { return { crashed: true }; }
  render() {
    if (this.state.crashed) {
      // Session failed (TV browser / network issue) — render children unauthenticated
      return <>{this.props.children}</>;
    }
    return (
      <NextAuthSessionProvider>{this.props.children}</NextAuthSessionProvider>
    );
  }
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  return <SessionBoundary>{children}</SessionBoundary>;
}
