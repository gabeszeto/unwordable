import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSave } from '../../save'; // ← update path if needed

import { useRunControls } from '../../game/useRunControls';

function PlayMenu({ hasOngoingGame }) {
  const navigate = useNavigate();
  const { startNewRun, resumeRun } = useRunControls(); // 👈 assume you add resumeRun helper later

  const continueRun = () => {
    const save = loadSave();
    console.log(save)
    if (!save) {
      // no save? just start fresh so button never “does nothing”
      startNewRun('/play');
      return;
    }
    // optionally could validate save.stage < FINAL_STAGE here
    resumeRun?.(save); // load contexts from save if you support this
    navigate('/play');
  };

  const playOptions = [
    { label: 'New Run', value: 'new', active: true, onClick: () => startNewRun('/play') },
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
            onKeyDown={e =>
              opt.active && (e.key === 'Enter' || e.key === ' ') && opt.onClick()
            }
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
