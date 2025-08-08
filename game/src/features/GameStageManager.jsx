import React, { useEffect } from 'react';
import GameScreen from './game/GameScreen';
import ShopScreen from './shop/ShopScreen';
import { useLevel } from '../contexts/level/LevelContext';
import { useDebuffs } from '../contexts/debuffs/DebuffsContext';
import { useDeath } from '../contexts/death/DeathContext';

import { generateDebuffPlan, generateDebugDebuffPlan } from './debuffs/generateDebuffPlan';

import DeathScreen from './game/DeathScreen';

import './gameStageManagerStyles.css'
import { useCorrectness } from '../contexts/CorrectnessContext';
import { BoardHelperProvider } from '../contexts/BoardHelperContext';
import { SkillsProvider } from '../contexts/skills/SkillsContext';

const FINAL_STAGE = 18;

export default function GameStageManager() {
  const { stage } = useLevel();
  const { resetCorrectness } = useCorrectness();

  const {
    addActiveDebuff,
    addPassiveDebuff,
    clearDebuffs,
    debuffPlan,
    setDebuffPlan
  } = useDebuffs();

  const { deathRound, reason } = useDeath();

  const round = Math.floor(stage / 2) + 1;

  // Initially set debuff plan
  useEffect(() => {
    // Only run once at game start
    if (Object.keys(debuffPlan).length === 0) {
      const plan = generateDebuffPlan();
      // const plan = generateDebugDebuffPlan({
      //   forcePassive: { NoFoureedom: 1, ShiftedGuess: 1, NoThreedom: 1, LetterLock: 1 },
      //   forceActive: []
      // });
      setDebuffPlan(plan);
      console.log(plan)
    }
  }, []);

  // Add the correct debuffs based off plan
  useEffect(() => {
    clearDebuffs();

    const roundPlan = debuffPlan[round];
    if (!roundPlan) return;

    for (const p of roundPlan.passive) addPassiveDebuff(p);
    for (const a of roundPlan.active) addActiveDebuff(a);
  }, [stage, debuffPlan]);



  const isGameLevel = stage % 2 === 0;
  const isDeath = stage === 100;
  const isShop = stage % 2 === 1;
  const isFinished = stage > FINAL_STAGE;

  // Reset truly correct in each game round
  useEffect(() => {
    if (isGameLevel) {
      resetCorrectness();
    }
  }, [stage]);

  const roundToUse = isDeath ? deathRound : round;
  const BOSS_STEPS = [3, 6, 9];
  const isBossRound = BOSS_STEPS.includes(roundToUse);
  const isFinalBoss = roundToUse === 10;
  const isShopThisRound = isShop && roundToUse === round;

  return (
    <div className="gameContainer">
      <div className="round-visual">
        <span className="round-label">
          {`Round ${roundToUse} of 10`}
          {isFinalBoss ? (
            <span className="round-badge final" title="Final Boss">💀 Final</span>
          ) : isBossRound ? (
            <span className="round-badge boss" title="Boss Round">⚠️ Boss</span>
          ) : null}
          {isShopThisRound && (
            <span className="round-badge shop" title="Shop">🛒 Shop</span>
          )}
        </span>

        <div className="round-progress-bar">
          {Array.from({ length: 10 }, (_, i) => {
            const step = i + 1;
            const isBoss = [3, 6, 9].includes(step);
            const isFinalBoss = step === 10;
            const isComplete = step < roundToUse;
            const isActive = step === round;
            const isDeathRound = step === deathRound;
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
        <SkillsProvider>
          <BoardHelperProvider>
            <GameScreen />
          </BoardHelperProvider>
        </SkillsProvider>
      ) : (
        <ShopScreen />
      )}
    </div>
  );
}
