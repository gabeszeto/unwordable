// GameScreen.jsx
import React, { useState } from 'react';
import Board from './components/Board.jsx';
import Keyboard from './components/Keyboard.jsx';
import { useNavigate } from 'react-router-dom';

import { useGold } from '../../contexts/gold/GoldContext.jsx';
import { calculateRoundGold } from '../../contexts/gold/goldUtils.js';

import './gameScreenStyles.css';

import shuffledWordles from '../../assets/shuffled_real_wordles.txt?raw';

import DivineInsight from '../perks/components/DivineInsight.jsx';
import ComponentsPerk from '../perks/components/Components.jsx';


export default function GameScreen() {
  const navigate = useNavigate()
  const [usedKeys, setUsedKeys] = useState({});

  const { gold, addGold } = useGold();
  const [goldEarned, setGoldEarned] = useState(0);

  const [round, setRound] = useState(1);
  const [perks, setPerks] = useState([]);

  // Perk states
  const [componentsUsed, setComponentsUsed] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState([]);
  const [divineUsed, setDivineUsed] = useState(false);

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
              setRound(r => r + 1);
              setRevealedIndices([]);
              setDivineUsed(false);
              setUsedKeys({});
              setComponentsUsed(false);
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
        <div className="active-perks">
          {perks.map((perk, i) => (
            <span className="perk-tag" key={i}>{perk.name}</span>
          ))}
        </div>
        <DivineInsight
          targetWord={targetWord}
          revealedIndices={revealedIndices}
          setRevealedIndices={setRevealedIndices}
          used={divineUsed}
          setUsed={setDivineUsed}
        />

        <ComponentsPerk
          targetWord={targetWord}
          used={componentsUsed}
          setUsed={setComponentsUsed}
        />
      </div>
      <div className="keyboard">
        <Keyboard usedKeys={usedKeys} onKeyPress={handleKeyPress} />
      </div>

    </div>
  );
}
