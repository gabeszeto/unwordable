import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSave } from '../../save';
import { useRunControls } from '../../game/useRunControls';

function PlayMenu({ hasOngoingGame }) {
  const navigate = useNavigate();
  const { startNewRun, resumeRun } = useRunControls();

  const continueRun = () => {
    const save = loadSave();
    console.log(save);
    if (!save) {
      startNewRun('/play');
      return;
    }
    resumeRun?.(save);
    navigate('/play');
  };

  // build options dynamically
  const playOptions = [
    { label: 'New Run', active: true, onClick: () => startNewRun('/play') },
    ...(hasOngoingGame
      ? [{ label: 'Continue', active: true, onClick: continueRun }]
      : [])
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
