import React, { useEffect } from 'react';
import GameScreen from './game/GameScreen';
import ShopScreen from './shop/ShopScreen';
import { useLevel } from '../contexts/level/LevelContext';
import { useDebuffs } from '../contexts/debuffs/DebuffsContext';
import { useDeath } from '../contexts/death/DeathContext';

import { debuffRegistry } from './debuffs/debuffRegistry';
import { pickWeightedDebuff } from './debuffs/pickWeightedDebuff'; // ⬅️ Make this if not yet made
import DeathScreen from './game/DeathScreen';

import './gameStageManagerStyles.css'

const FINAL_STAGE = 18;
const BOSS_STAGES = [4, 10, 16, 18];

export default function GameStageManager() {
  const { stage } = useLevel();
  const { addDebuff, clearDebuffs } = useDebuffs();
  const { deathRound, reason } = useDeath();

  const round = Math.floor(stage / 2) + 1;

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

  const isGameLevel = stage % 2 === 0;
  const isDeath = stage === 100;
  const isShop = stage % 2 === 1;
  const isFinished = stage > FINAL_STAGE;

  const roundToUse = isDeath ? deathRound : round;

  return (
    <div className="gameContainer">
      <div className="round-visual">
        <span className="round-label">
          {`Round ${roundToUse} of 10`}
        </span>
        <div className="round-progress-bar">
          {Array.from({ length: 10 }, (_, i) => {
            const step = i + 1;
            const isBoss = [3, 6, 9].includes(step);
            const isFinalBoss = step === 10;
            const isComplete = step < roundToUse
            const isActive = step === round;
            const isDeathRound = step === deathRound
            const isShopRound = isShop && step === round;

            return (
              <div
                key={i}
                className={`
                round-step
                ${isFinalBoss ? 'finalBoss' : ''}
                ${isBoss ? 'boss' : ''}
                ${isComplete ? 'complete' : ''}
                ${isActive ? 'active' : ''}
                ${isShopRound ? 'shop-outline' : ''}
                ${isDeathRound ? 'died' : ''}
                `}
              />
            );
          })}
        </div>
      </div>

      {/* Render appropriate screen */}
      {isDeath ? (
        <DeathScreen />
      ) : isFinished ? (
        <div className="end-screen">
          <h1>🏁 Game Over</h1>
          <p>You survived. Congrats.</p>
        </div>
      ) : isGameLevel ? (
        <GameScreen />
      ) : (
        <ShopScreen />
      )}
    </div>
  );
}
