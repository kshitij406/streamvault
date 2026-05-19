'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, BookOpen, Bookmark } from 'lucide-react';

const links = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/movies', icon: Film, label: 'Movies' },
  { href: '/tv-shows', icon: Tv, label: 'TV' },
  { href: '/diary', icon: BookOpen, label: 'Diary' },
  { href: '/watchlist', icon: Bookmark, label: 'Saved' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-white/10 safe-area-inset-bottom">
      <div className="flex items-stretch h-14">
        {links.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-accent' : 'text-gray-500 active:text-gray-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'fill-accent/20' : ''}`} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
