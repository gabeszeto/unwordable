// PlayMenu.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSave, clearSave } from '../../save'; // ← update path if needed

import { useLevel } from '../../../contexts/level/LevelContext';
import { useRunStats } from '../../../contexts/RunStatsContext';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';
import { useCorrectness } from '../../../contexts/CorrectnessContext';
import { useCash } from '../../../contexts/cash/CashContext';

const STARTING_CASH = 5;

function PlayMenu({ hasOngoingGame }) {
  const navigate = useNavigate();

  // contexts we need to reset for a fresh run

  const levelCtx       = useLevel?.();
  const runStatsCtx    = useRunStats?.();
  const debuffsCtx     = useDebuffs?.();
  const correctnessCtx = useCorrectness?.();
  const cashCtx        = useCash?.();

  console.log('[PlayMenu ctx]', {
    hasLevel: !!levelCtx,
    hasRunStats: !!runStatsCtx,
    hasDebuffs: !!debuffsCtx,
    hasCorrectness: !!correctnessCtx,
    hasCash: !!cashCtx,
    levelCtx,
  });

  if (!levelCtx || !runStatsCtx || !debuffsCtx || !correctnessCtx || !cashCtx) {
    console.error('One or more providers are missing above <PlayMenu>.');
  }

  const { resetLevel } = levelCtx ?? {};
  const { resetRunStats } = runStatsCtx ?? {};
  const { clearDebuffs, setDebuffPlan } = debuffsCtx ?? {};
  const { resetCorrectness } = correctnessCtx ?? {};
  const { resetCash, addCash } = cashCtx ?? {};

//   const { resetLevel } = useLevel();
//   const { resetRunStats } = useRunStats();
//   const { clearDebuffs, setDebuffPlan } = useDebuffs();
//   const { resetCorrectness } = useCorrectness();
//   const { resetCash, addCash } = useCash();

  const startNewRun = () => {
    // 1) wipe persisted save
    clearSave();

    // 2) reset all in-memory slices
    resetRunStats();
    resetLevel();
    setDebuffPlan({});     // forces a fresh plan on next mount
    clearDebuffs();
    resetCorrectness();

    // 3) set starting wallet (your CashContext reset() goes to 0)
    resetCash();
    if (STARTING_CASH > 0) addCash(STARTING_CASH);

    // 4) go play
    navigate('/play');
  };

  const continueRun = () => {
    const save = loadSave();
    if (!save) {
      // no save? just start fresh so button never “does nothing”
      startNewRun();
      return;
    }
    navigate('/play');
  };

  const playOptions = [
    { label: 'New Run', value: 'new', active: true, onClick: startNewRun },
    { label: 'Continue', value: 'continue', active: hasOngoingGame, onClick: continueRun },
  ];

  return (
    <div className="playMenu">
      <div className="homeButtons">
        {playOptions.map((opt, i) => (
          <div
            key={i}
            className={`homeButton ${!opt.active ? 'disabled' : ''}`}
            onClick={() => opt.active && opt.onClick()}
            role="button"
            tabIndex={opt.active ? 0 : -1}
            onKeyDown={e => opt.active && (e.key === 'Enter' || e.key === ' ') && opt.onClick()}
            aria-disabled={!opt.active}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayMenu;
