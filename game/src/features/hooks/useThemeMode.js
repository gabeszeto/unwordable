// useThemeMode.js
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'unwordable.theme';
const LIGHT_BG = '#ffffff';
const DARK_BG  = '#0b0e14';

function setMetaThemeColor(dark) {
  let meta = document.querySelector('meta[name="theme-color"][data-dynamic]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('data-dynamic', '');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', dark ? DARK_BG : LIGHT_BG);
}

export default function useThemeMode() {
  const mql = useMemo(
    () => (typeof window !== 'undefined' && window.matchMedia)
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null,
    []
  );

  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const [systemPrefDark, setSystemPrefDark] = useState(() => !!mql?.matches);

  useEffect(() => {
    if (!mql) return;
    const handler = (e) => setSystemPrefDark(e.matches);
    setSystemPrefDark(mql.matches);
    mql.addEventListener?.('change', handler) || mql.addListener?.(handler);
    return () => {
      mql.removeEventListener?.('change', handler) || mql.removeListener?.(handler);
    };
  }, [mql]);

  const effectiveDark = mode === 'dark' || (mode === 'system' && systemPrefDark);
  const resolved = mode === 'system' ? (systemPrefDark ? 'dark' : 'light') : mode;

  // 👇 track previous scheme so we only kill transitions on actual flips
  const prevDarkRef = useRef(null);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const prev = prevDarkRef.current;
    const schemeChanged = prev !== null && prev !== effectiveDark;

    // disable transitions just for the flip
    if (schemeChanged) html.classList.add('theme-swapping');

    if (mode === 'system') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
    setMetaThemeColor(effectiveDark);

    prevDarkRef.current = effectiveDark;

    let r1 = 0, r2 = 0;
    if (schemeChanged) {
      r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => {
          html.classList.remove('theme-swapping');
        });
      });
    }
    return () => {
      if (schemeChanged) {
        html.classList.remove('theme-swapping');
        if (r1) cancelAnimationFrame(r1);
        if (r2) cancelAnimationFrame(r2);
      }
    };
  }, [mode, effectiveDark]);

  return { mode, setMode, isDark: effectiveDark, resolved };
}
