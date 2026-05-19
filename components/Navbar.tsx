'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Search, Bookmark, Menu, X, Play, Film, Tv, LogOut, ChevronDown, BookOpen,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  const linkCls = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path) ? 'text-white' : 'text-gray-400 hover:text-white'
    }`;

  const displayName = session?.user?.name ?? session?.user?.email ?? '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-white/5 shadow-lg'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Left: logo + primary nav */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
              <Play className="w-5 h-5 text-accent fill-accent" />
              <span className="text-base sm:text-lg font-bold tracking-tight">
                Stream<span className="text-accent">Vault</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-5 lg:gap-6">
              <Link href="/" className={linkCls('/')}>Home</Link>
              <Link href="/movies" className={`${linkCls('/movies')} flex items-center gap-1.5`}>
                <Film className="w-3.5 h-3.5" />
                Movies
              </Link>
              <Link href="/tv-shows" className={`${linkCls('/tv-shows')} flex items-center gap-1.5`}>
                <Tv className="w-3.5 h-3.5" />
                TV Shows
              </Link>
              <Link href="/diary" className={`${linkCls('/diary')} flex items-center gap-1.5`}>
                <BookOpen className="w-3.5 h-3.5" />
                Diary
              </Link>
            </div>
          </div>

          {/* Right: search, watchlist, auth */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5">
            <Link href="/search" className={`${linkCls('/search')} flex items-center gap-1.5`}>
              <Search className="w-3.5 h-3.5" />
              Search
            </Link>
            <Link href="/watchlist" className={`${linkCls('/watchlist')} flex items-center gap-1.5`}>
              <Bookmark className="w-3.5 h-3.5" />
              Watchlist
            </Link>

            {session ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1"
                >
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white">
                    {initials}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs font-medium text-white truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-accent hover:bg-accent/80 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 text-gray-300 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-white/10 px-4 py-5 space-y-1">
          {[
            { href: '/', label: 'Home' },
            { href: '/movies', label: 'Movies' },
            { href: '/tv-shows', label: 'TV Shows' },
            { href: '/search', label: 'Search' },
            { href: '/watchlist', label: 'Watchlist' },
            { href: '/diary', label: 'Diary' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="border-t border-white/10 pt-3 mt-3">
            {session ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block w-full text-center bg-accent hover:bg-accent/80 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
