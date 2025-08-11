import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'unwordable.theme'; // 'light' | 'dark' | 'system'

export default function useThemeMode() {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const mql = useMemo(() => window.matchMedia?.('(prefers-color-scheme: dark)'), []);

  // apply classes to <body>
  useEffect(() => {
    const b = document.body;
    b.classList.remove('theme-dark', 'theme-light');
    if (mode === 'dark') b.classList.add('theme-dark');
    if (mode === 'light') b.classList.add('theme-light');
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // keep in sync with OS when in system mode
  useEffect(() => {
    if (!mql) return;
    const onChange = () => {
      if (mode === 'system') {
        // Re-apply class based on OS
        const b = document.body;
        b.classList.remove('theme-dark', 'theme-light');
        if (mql.matches) b.classList.add('theme-dark');
      }
    };
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [mode, mql]);

  // derived: actual dark?
  const isDark = mode === 'dark' || (mode === 'system' && mql?.matches);

  return { mode, setMode, isDark };
}
