// GameScreen.jsx
import React, { useState } from 'react';
import Board from './components/Board.jsx';
import Keyboard from './components/Keyboard.jsx';
import { useNavigate } from 'react-router-dom';

import { useGold } from '../../contexts/gold/GoldContext.jsx';
import { calculateRoundGold } from '../../contexts/gold/goldUtils.js';
import { useLevel } from '../../contexts/level/LevelContext';

import PerkDisplay from './components/PerkDisplay.jsx';

import './gameScreenStyles.css';
import './popups/popupScreenStyles.css'

import HintInfoScreen from './popups/HintInfoScreen.jsx'

import shuffledWordles from '../../assets/shuffled_real_wordles.txt?raw';

export default function GameScreen() {
  const { stage, advanceStage } = useLevel();
  const { gold, addGold } = useGold();

  const navigate = useNavigate()

  const [usedKeys, setUsedKeys] = useState({});
  const [goldEarned, setGoldEarned] = useState(0);
  const round = stage / 2 + 1;

  // Perk states
  const [revealedIndices, setRevealedIndices] = useState([]);
  const [usedPerks, setUsedPerks] = useState([]);

  const isKeyzoneUsed = usedPerks.some((key) => key.startsWith('keyzone'));

  const markPerkAsUsed = (key) => {
    setUsedPerks((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const resetUsedPerks = () => {
    setUsedPerks([]);
  };

  // KB stuff
  const [keyzoneType, setKeyzoneType] = useState(null); // 'row' | 'segment' | 'grid' | null
  const [keyzoneOverlayVisible, setKeyzoneOverlayVisible] = useState(false);

  // Perk Info stuff
  const [infoPerkKey, setInfoPerkKey] = useState(null); // e.g. "Anatomy"
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const allWords = shuffledWordles.split('\n').map(w => w.trim().toUpperCase());
  const [targetWords] = useState(() =>
    Array.from({ length: 10 }, () => allWords[Math.floor(Math.random() * allWords.length)])
  );

  const targetWord = targetWords[round - 1];

  // perk stuff
  const sharedProps = {
    targetWord,
    onKBActivate: setKeyzoneType,
    revealedIndices,
    setRevealedIndices,
    setInfoPerkKey
  };

  const [virtualKeyHandler, setVirtualKeyHandler] = useState(null);
  const handleKeyPress = (key) => {
    if (virtualKeyHandler) virtualKeyHandler({ key });
  };

  if (round > 10) {
    return (
      <div className="game-screen end-screen">
        <h1>🏁 Game Over</h1>
        <p>You earned {gold} gold!</p>
        {/* Optionally, a "Play Again" button */}
      </div>
    );
  }

  return (
    <div className="game-screen">

      <div>
        <Board
          key={round}
          onRoundComplete={async (success, guesses) => {
            if (success) {
              const earned = calculateRoundGold({
                guessesUsed: guesses.length,
                isBoss: round % 3 === 0
              });
              addGold(earned);
              setGoldEarned(earned);
              await new Promise((resolve) => setTimeout(resolve, 2000));
              advanceStage();

              // reset everything including perks
              resetUsedPerks();
              setRevealedIndices([]);
              setUsedKeys({});
              setKeyzoneType(null);
              setKeyzoneOverlayVisible(false);
            } else {
              await new Promise((resolve) => setTimeout(resolve, 1500));
              navigate('/');
            }
          }}
          setUsedKeys={setUsedKeys}
          usedKeys={usedKeys}
          targetWord={targetWord}
          revealedIndices={revealedIndices}
          setRevealedIndices={setRevealedIndices}
          onVirtualKey={setVirtualKeyHandler}
          goldEarned={goldEarned}
        />
      </div>

      <div className="hud">
        <PerkDisplay
          usedPerks={usedPerks}
          markAsUsed={markPerkAsUsed}
          sharedProps={sharedProps}
          isKeyzoneUsed={isKeyzoneUsed}

        />
      </div>


      <div className="gameButtons">
        {keyzoneType && (
          <button
            className="toggle-overlay-button"
            onClick={() => setKeyzoneOverlayVisible((v) => !v)}
          >
            {keyzoneOverlayVisible ? 'Hide Overlay' : 'Show Overlay'}
          </button>
        )}
        {infoPerkKey && (
          <button
            className="toggle-overlay-button"
            onClick={() => setShowInfoPanel((prev) => !prev)}
          >
            {showInfoPanel ? 'Hide Info' : 'Show Info'}
          </button>
        )}
      </div>
      <Keyboard
        usedKeys={usedKeys}
        onKeyPress={handleKeyPress}
        keyzoneType={keyzoneOverlayVisible ? keyzoneType : null}
        targetWord={targetWord}
      />

      {/* popups */}
      {showInfoPanel && (
        <div
          className="popup-overlay"
          onClick={() => {
            setShowInfoPanel(false);
          }}
        >
          <div
            className="popup-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing if clicking inside
          >
            <button
              className="popup-close"
              onClick={() => {
                setShowInfoPanel(false);
              }}
            >
              &times;
            </button>
            <HintInfoScreen perkKey={infoPerkKey} targetWord={targetWord} />
          </div>
        </div>
      )}

    </div>
  );
}
