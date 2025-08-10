// src/hooks/useShiftHeld.js
import { useEffect, useState } from 'react';
export default function useShiftHeld() {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const down = (e) => e.key === 'Shift' && setHeld(true);
    const up = (e) => e.key === 'Shift' && setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return held;
}
