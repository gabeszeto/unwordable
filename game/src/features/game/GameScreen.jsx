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

  const markPerkAsUsed = (key) => {
    setUsedPerks((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const resetUsedPerks = () => {
    setUsedPerks([]);
  };

  // KB stuff
  const [keyzoneType, setKeyzoneType] = useState(null); // 'row' | 'segment' | 'grid' | null
  const [keyzoneOverlayVisible, setKeyzoneOverlayVisible] = useState(false);

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
    setRevealedIndices
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

      <div className="round-visual">
        <span className="round-label">Round {round} of 10</span>
        <div className="round-progress-bar">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`round-step ${i + 1 < round ? 'complete' : ''} ${i + 1 === round ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

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
              await new Promise((resolve) => setTimeout(resolve, 1000));
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
      </div>
      <div className="keyboard">
        <Keyboard
          usedKeys={usedKeys}
          onKeyPress={handleKeyPress}
          keyzoneType={keyzoneOverlayVisible ? keyzoneType : null}
          targetWord={targetWord}
        />
      </div>

    </div>
  );
}
