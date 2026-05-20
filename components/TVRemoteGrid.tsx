'use client';

import { useEffect } from 'react';

// Minimal 10-foot remote navigation:
// - ArrowUp/ArrowDown moves focus between rows of posters
// - ArrowLeft/ArrowRight within a row is already handled by MediaRow
//
// Strategy: each MediaRow registers itself with `data-tv-row` and each card link
// has `tabIndex={0}`. We move focus to the nearest card in the target row.
export default function TVRemoteGrid() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      const active = document.activeElement as HTMLElement | null;
      if (!active) return;

      // Only engage when a card is focused.
      const currentRow = active.closest<HTMLElement>('[data-tv-row]');
      if (!currentRow) return;

      const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-tv-row]'));
      const idx = rows.indexOf(currentRow);
      if (idx === -1) return;

      const targetRow = e.key === 'ArrowDown' ? rows[idx + 1] : rows[idx - 1];
      if (!targetRow) return;

      const tCards = Array.from(targetRow.querySelectorAll<HTMLElement>('a[tabindex="0"]'));
      if (tCards.length === 0) return;

      e.preventDefault();

      const curRect = active.getBoundingClientRect();
      const curX = curRect.left + curRect.width / 2;

      let best = tCards[0];
      let bestDist = Number.POSITIVE_INFINITY;
      for (const c of tCards) {
        const r = c.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const dist = Math.abs(x - curX);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }

      best.focus();
      best.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return null;
}
