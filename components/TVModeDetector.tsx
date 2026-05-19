'use client';

import { useEffect } from 'react';

export default function TVModeDetector() {
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const tvByUA =
      /smart[-\s]?tv|smarttv|tizen|webos|android\s?tv|googletv|appletv|hbbtv|netcast|philips|viera|bravia|roku|fire\s?tv|firetv|lgtv|nettv/.test(ua);

    // Heuristic for TV browsers: 1080p+ screen, no touch, pixel ratio = 1
    const tvByScreen =
      window.screen.width >= 1920 &&
      window.screen.height >= 1080 &&
      !('ontouchstart' in window) &&
      window.devicePixelRatio === 1;

    if (tvByUA || tvByScreen) {
      document.documentElement.classList.add('tv-mode');
    }
  }, []);

  return null;
}
