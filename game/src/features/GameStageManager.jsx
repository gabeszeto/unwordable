import React, { useEffect } from 'react';
import GameScreen from './game/GameScreen';
import ShopScreen from './shop/ShopScreen';
import { useLevel } from '../contexts/level/LevelContext';
import { useDebuffs } from '../contexts/debuffs/DebuffsContext';
import { debuffRegistry } from './debuffs/debuffRegistry';
import { pickWeightedDebuff } from './debuffs/pickWeightedDebuff'; // ⬅️ Make this if not yet made

import './gameStageManagerStyles.css'

const FINAL_STAGE = 18;
const BOSS_STAGES = [0, 2, 10, 16, 18];

export default function GameStageManager() {
  const { stage } = useLevel();
  const { addDebuff, clearDebuffs } = useDebuffs();
  const round = stage / 2 + 1;

  useEffect(() => {
    if (BOSS_STAGES.includes(stage)) {
      clearDebuffs()
      const debuffKey = pickWeightedDebuff(debuffRegistry);
      if (debuffKey) {
        addDebuff(debuffKey);
      }
    } else {
      clearDebuffs()
    }
  }, [stage]);

  if (stage > FINAL_STAGE) {
    return (
      <div className="end-screen">
        <h1>🏁 Game Over</h1>
        <p>You survived. Congrats.</p>
      </div>
    );
  }

  const isGameLevel = stage % 2 === 0;

  return (
    <>
      <div className="round-visual">
        <span className="round-label">Round {round} of 10</span>
        <div className="round-progress-bar">
          {Array.from({ length: 10 }, (_, i) => {
            const step = i + 1;
            const isBoss = [3, 6, 9].includes(step); // Final level (step 10) is also a boss
            const isFinalBoss = step === 10;
            const isComplete = step < round;
            const isActive = step === round;

            return (
              <div
                key={i}
                className={`round-step
                ${isFinalBoss ? 'finalBoss' : ''}
                ${isBoss ? 'boss' : ''}
                ${isComplete ? 'complete' : ''}
                ${isActive ? 'active' : ''}`}
              />
            );
          })}
        </div>
      </div>
      {isGameLevel ? <GameScreen /> : <ShopScreen />}
    </>
  );
}
