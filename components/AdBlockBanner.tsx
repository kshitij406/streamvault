'use client';

import { useEffect, useState } from 'react';

export default function AdBlockBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if ((navigator as unknown as { brave?: unknown }).brave) return;
    if (localStorage.getItem('adblock_dismissed')) return;

    setVisible(true);
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem('adblock_dismissed', 'true');
    setMounted(false);
    setTimeout(() => setVisible(false), 300);
  }

  return (
    <div
      // Keep clear of the mobile bottom tab bar.
      className={`fixed bottom-14 md:bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        mounted ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ backgroundColor: '#1a1a1a', borderTop: '2px solid #e50914' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
        <p className="text-sm text-gray-300 flex-1 text-center sm:text-left">
          For the best experience with no popups, use Brave Browser or install uBlock Origin.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://brave.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#fb542b] text-white hover:bg-[#e0421a] transition-colors"
          >
            Get Brave
          </a>
          <a
            href="https://ublockorigin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors"
          >
            Get uBlock
          </a>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="ml-1 text-xl leading-none text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
