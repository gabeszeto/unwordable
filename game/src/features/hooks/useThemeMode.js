// useThemeMode.js
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

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

  // user choice
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  // system preference as STATE (so React can re-render when OS changes)
  const [systemPrefDark, setSystemPrefDark] = useState(() => !!mql?.matches);

  // keep systemPrefDark in sync with OS; also run once on mount
  useEffect(() => {
    if (!mql) return;
    const handler = (e) => setSystemPrefDark(e.matches);
    // set immediate value (covers the case when switching to 'system')
    setSystemPrefDark(mql.matches);
    mql.addEventListener?.('change', handler) || mql.addListener?.(handler);
    return () => {
      mql.removeEventListener?.('change', handler) || mql.removeListener?.(handler);
    };
  }, [mql]);

  // resolved/effective theme
  const effectiveDark = mode === 'dark' || (mode === 'system' && systemPrefDark);
  const resolved = mode === 'system' ? (systemPrefDark ? 'dark' : 'light') : mode;

  // apply to <html> + meta (runs immediately when you switch to 'system')
  useLayoutEffect(() => {
    const html = document.documentElement;
    if (mode === 'system') html.removeAttribute('data-theme');
    else html.setAttribute('data-theme', mode);
    localStorage.setItem(STORAGE_KEY, mode);
    setMetaThemeColor(effectiveDark);
  }, [mode, effectiveDark]);

  return { mode, setMode, isDark: effectiveDark, resolved };
}
