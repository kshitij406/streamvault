'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Bookmark, Menu, X, Play } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      pathname === path ? 'text-white' : 'text-gray-400 hover:text-white'
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-sm border-b border-white/5'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Play className="w-5 h-5 text-accent fill-accent" />
            <span className="text-lg font-bold tracking-tight">
              Stream<span className="text-accent">Vault</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <Link href="/" className={linkClass('/')}>Home</Link>
            <Link href="/search" className={`${linkClass('/search')} flex items-center gap-1.5`}>
              <Search className="w-3.5 h-3.5" />
              Search
            </Link>
            <Link href="/watchlist" className={`${linkClass('/watchlist')} flex items-center gap-1.5`}>
              <Bookmark className="w-3.5 h-3.5" />
              Watchlist
            </Link>
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-sm border-t border-white/10 px-4 py-4 space-y-4">
          <Link href="/" className="block text-sm text-gray-300 hover:text-white" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/search" className="block text-sm text-gray-300 hover:text-white" onClick={() => setOpen(false)}>Search</Link>
          <Link href="/watchlist" className="block text-sm text-gray-300 hover:text-white" onClick={() => setOpen(false)}>Watchlist</Link>
        </div>
      )}
    </nav>
  );
}
