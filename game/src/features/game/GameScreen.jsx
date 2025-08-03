// GameScreen.jsx
import React, { useState } from 'react';
import Board from './components/Board.jsx';
import Keyboard from './components/Keyboard.jsx';
import { useNavigate } from 'react-router-dom';

import { useGold } from '../../contexts/gold/GoldContext.jsx';
import { calculateRoundGold } from '../../contexts/gold/goldUtils.js';
import { useLevel } from '../../contexts/level/LevelContext';

import { usePerks } from '../../contexts/perks/PerksContext';
import { perkRegistry } from '../perks/perkRegistry.js';

import './gameScreenStyles.css';

import shuffledWordles from '../../assets/shuffled_real_wordles.txt?raw';

export default function GameScreen() {
  const { stage, advanceStage } = useLevel();
  const { gold, addGold } = useGold();
  const { perks, usePerk } = usePerks();

  const navigate = useNavigate()

  const [usedKeys, setUsedKeys] = useState({});
  const [goldEarned, setGoldEarned] = useState(0);
  const round = stage / 2 + 1;

  // Perk states
  const [componentsUsed, setComponentsUsed] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState([]);
  const [divineUsed, setDivineUsed] = useState(false);
  // fix this doodoo and put into array later

  // KB stuff
  const [keyzoneType, setKeyzoneType] = useState(null); // 'row' | 'segment' | 'grid' | null
  const [keyzoneOverlayVisible, setKeyzoneOverlayVisible] = useState(false);

  const allWords = shuffledWordles.split('\n').map(w => w.trim().toUpperCase());
  const [targetWords] = useState(() =>
    Array.from({ length: 10 }, () => allWords[Math.floor(Math.random() * allWords.length)])
  );

  const targetWord = targetWords[round - 1];

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

  console.log(`[GAME] Perks in context:`, perks);

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
              await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s pause
              advanceStage();
              setRevealedIndices([]);
              setDivineUsed(false);
              setUsedKeys({});
              setComponentsUsed(false);
              setKeyzoneType(null);
              setKeyzoneOverlayVisible(false);
            } else {
              await new Promise((resolve) => setTimeout(resolve, 1500)); // short pause
              navigate('/'); // send to home screen
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
        <div className="round-meter">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`round-dot ${i + 1 === round ? 'active' : i + 1 < round ? 'complete' : ''}`}
            />
          ))}
        </div>
        <div className="gold-counter">🪙 {gold}</div>
        <div className="perksDisplay">
          {Object.entries(perks).map(([key, quantity]) => {
            if (quantity <= 0) return null;
            const { component: PerkComponent } = perkRegistry[key] || {};
            if (!PerkComponent) return null;

            return (
              <PerkComponent
                key={key}
                perkKey={key}
                targetWord={targetWord}
                onKBActivate={setKeyzoneType}
                revealedIndices={revealedIndices}
                setRevealedIndices={setRevealedIndices}
                used={key === 'Revelation' ? divineUsed : componentsUsed}
                setUsed={key === 'Revelation' ? setDivineUsed : setComponentsUsed}
                onUse={() => usePerk(key)}
              />
            );
          })}
        </div>
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
