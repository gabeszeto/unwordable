// GameScreen.jsx
import React, { useState } from 'react';
import Board from './components/Board.jsx';
import Keyboard from './components/Keyboard.jsx';

import { useGold } from '../../contexts/gold/GoldContext.jsx';
import { calculateRoundGold } from '../../contexts/gold/goldUtils.js';
import { useLevel } from '../../contexts/level/LevelContext';
import { useDeath } from '../../contexts/death/DeathContext'
import { useDebuffs } from '../../contexts/debuffs/DebuffsContext.jsx';

import PerkDisplay from './components/PerkDisplay.jsx';

import './gameScreenStyles.css';
import './popups/popupScreenStyles.css'

import HintInfoScreen from './popups/HintInfoScreen.jsx'

import shuffledWordles from '../../assets/shuffled_real_wordles.txt?raw';

export default function GameScreen() {
  const { stage, setStage, advanceStage } = useLevel();
  const { setDeathInfo } = useDeath();
  const { gold, addGold } = useGold();
  const { activeDebuffs, passiveDebuffs } = useDebuffs();

  const BOSS_STAGES = [4, 10, 16, 18];

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

  // KB and board logic for delayed feedback
  const [feedbackShownUpToRow, setFeedbackShownUpToRow] = useState(-1);

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

      {/* passives and debuffs display */}
      <div className="modifiersDisplay">
        <div className="mod-left">
          {BOSS_STAGES.includes(stage) ? 'Boss Level' : 'Normal Level'}
        </div>

        <div className="mod-right">
          {activeDebuffs.length === 0 && Object.keys(passiveDebuffs || {}).length === 0 ? (
            <span className="mod-none">No modifiers</span>
          ) : (
            <>
              {Object.entries(passiveDebuffs || {}).map(([debuffKey, level]) => (
                <span className="mod-debuff passive" key={`passive-${debuffKey}`}>
                  {debuffKey}{level > 1 ? ` ×${level}` : ''}
                </span>
              ))}
              {activeDebuffs.map((debuffKey, i) => (
                <span className="mod-debuff active" key={`active-${i}`}>
                  {debuffKey}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      <Board
        key={round}
        onRoundComplete={async (success, guesses, deathReason) => {
          if (success) {
            const earned = calculateRoundGold({
              guessesUsed: guesses.length,
              isBoss: round % 3 === 0
            });
            addGold(earned);
            setGoldEarned(earned);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            advanceStage();

            // Reset things
            resetUsedPerks();
            setRevealedIndices([]);
            setUsedKeys({});
            setKeyzoneType(null);
            setKeyzoneOverlayVisible(false);
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setDeathInfo({
              deathRound: round,
              reason: deathReason || 'Out of guesses',
            });
            setStage(100);
          }
        }}

        setUsedKeys={setUsedKeys}
        usedKeys={usedKeys}
        targetWord={targetWord}
        revealedIndices={revealedIndices}
        setRevealedIndices={setRevealedIndices}
        onVirtualKey={setVirtualKeyHandler}
        goldEarned={goldEarned}
        feedbackShownUpToRow={feedbackShownUpToRow}
        setFeedbackShownUpToRow={setFeedbackShownUpToRow}
      />

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
        feedbackShownUpToRow={feedbackShownUpToRow}
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
