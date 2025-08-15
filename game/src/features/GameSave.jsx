// src/app/GameSave.tsx
import React, { useEffect, useLayoutEffect } from 'react';
import { loadSave, persistSave } from './save';
import { useLevel } from '../contexts/level/LevelContext';
import { useCash } from '../contexts/cash/CashContext';
import { useRunStats } from '../contexts/RunStatsContext';

export default function GameSave({ children }) {
  const { stage, setStage } = useLevel();
  const { cash, addCash, resetCash } = useCash();
  const { stats, hydrateRunStats } = useRunStats();

  const hydratedRef = React.useRef(false);

  // Hydrate ASAP to avoid flicker
  useLayoutEffect(() => {
    if (hydratedRef.current) return;
    const save = loadSave();
    if (save) {
      if (typeof save.stage === 'number') setStage(save.stage);

      // CashContext doesn't expose a setter, so normalize via reset+add
      if (typeof save.cash === 'number') {
        resetCash();
        if (save.cash > 0) addCash(save.cash);
      }

      if (save.runStats) hydrateRunStats(save.runStats);
    }
    hydratedRef.current = true;
  }, [setStage, addCash, resetCash, hydrateRunStats]);

  // Persist whenever any tracked slice changes
  useEffect(() => {
    if (!hydratedRef.current) return;             // ⬅️ skip first render while we hydrate
    persistSave(
      { stage, cash, runStats: stats },
      'GameSave/useEffect'                        // ⬅️ tag your writes
    );
  }, [stage, cash, stats]);

  return <>{children}</>;
}
