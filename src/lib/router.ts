/**
 * Küçük karma (#) yönlendirici. GitHub Pages'te ve çevrimdışı kurulumda
 * sayfa yenilemesi her zaman index.html'e düşer; ayrı bir kütüphane gerekmez.
 */
import { useEffect, useState } from 'react';

export function parseHash(h = window.location.hash): { path: string; parts: string[]; query: URLSearchParams } {
  const raw = h.replace(/^#/, '') || '/today';
  const [p, q = ''] = raw.split('?');
  const path = p.startsWith('/') ? p : '/' + p;
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash());
  useEffect(() => {
    const on = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (path: string) => {
  window.location.hash = path;
};

export const back = (fallback = '/today') => {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
};
