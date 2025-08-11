import React, { useEffect } from 'react';
import GameScreen from './game/GameScreen';
import ShopScreen from './shop/ShopScreen';

import { useLevel } from '../contexts/level/LevelContext';
import { useDebuffs } from '../contexts/debuffs/DebuffsContext';
import { useDeath } from '../contexts/death/DeathContext';
import { useRunStats } from '../contexts/RunStatsContext';

import { useNavigate } from 'react-router-dom';

import ThemeToggle from './ThemeToggle';
import { generateDebuffPlan /*, generateDebugDebuffPlan*/ } from './debuffs/generateDebuffPlan';

import DeathScreen from './game/DeathScreen';
import EndScreen from './game/EndScreen';

import './gameStageManagerStyles.css';
import { useCorrectness } from '../contexts/CorrectnessContext';
import { BoardHelperProvider } from '../contexts/BoardHelperContext';
import { SkillsProvider } from '../contexts/skills/SkillsContext';

const FINAL_STAGE = 18;

export default function GameStageManager() {
  // Level/progression
  const { stage, setStage, resetLevel, getRoundNumber } = useLevel();
  const round = getRoundNumber(stage);
  const isGameLevel = stage % 2 === 0;
  const isShop = stage % 2 === 1;
  const isDeath = stage === 100;
  const isFinished = stage > FINAL_STAGE;
  const appliedStageRef = React.useRef(-1);
  const navigate = useNavigate()

  // Debuffs
  const {
    addActiveDebuff,
    addPassiveDebuff,
    clearDebuffs,
    debuffPlan,
    setDebuffPlan,
  } = useDebuffs();

  // Death + correctness
  const { deathRound /*, reason*/ } = useDeath();
  const { resetCorrectness } = useCorrectness();

  // Run stats
  const { stats, resetRunStats, noteDebuffsFaced } = useRunStats();

  // Initial debuff plan (once)
  useEffect(() => {
    if (Object.keys(debuffPlan).length === 0) {
      const plan = generateDebuffPlan();
      // const plan = generateDebugDebuffPlan({ forcePassive: { CutShort: 2, ShiftedGuess: 1 }, forceActive: [] });
      setDebuffPlan(plan);
      console.log('[Debuff Plan]', plan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply debuffs when stage changes
  useEffect(() => {
    clearDebuffs();

    const roundPlan = debuffPlan[round];
    if (!roundPlan) return;

    (roundPlan.passive || []).forEach(p => addPassiveDebuff(p));
    (roundPlan.active || []).forEach(a => addActiveDebuff(a));

    // record debuffs faced this run (unique set maintained in context)
    noteDebuffsFaced([...(roundPlan.passive || []), ...(roundPlan.active || [])]);
  }, [stage, debuffPlan, round]);

  // Reset correctness each new GAME round
  useEffect(() => {
    if (isGameLevel) resetCorrectness();
  }, [isGameLevel, resetCorrectness]);

  useEffect(() => {
    if (appliedStageRef.current === stage) return;
    appliedStageRef.current = stage;

    clearDebuffs();
    const roundPlan = debuffPlan[round];
    if (!roundPlan) return;

    (roundPlan.passive || []).forEach(p => addPassiveDebuff(p));
    (roundPlan.active || []).forEach(a => addActiveDebuff(a));

    noteDebuffsFaced([...(roundPlan.passive || []), ...(roundPlan.active || [])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, debuffPlan, round]);


  // Round visuals
  const roundToUse = isDeath ? deathRound : round;
  const BOSS_STEPS = [3, 6, 9];
  const isBossRound = BOSS_STEPS.includes(roundToUse);
  const isFinalBoss = roundToUse === 10;
  const isShopThisRound = isShop && roundToUse === round;

  // Time string from runStats
  const runTimeString = stats?.runStartedAt
    ? (() => {
      const ms = Date.now() - stats.runStartedAt;
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      return `${m}m ${s}s`;
    })()
    : null;

  // Restart handler
  const restartRun = () => {
    resetRunStats();
    resetLevel();        // back to stage 0 (Round 1)
    setDebuffPlan({});   // regenerate on next mount
    clearDebuffs();
    resetCorrectness();
  };


  const goToMenu = () => {
    restartRun()
    navigate('/')
  }
  return (
    <div className="gameContainer">
      {/* Sticky Navbar */}
      <div className="navBar">
        <div className="navContent">
          <div className="nav-left" />
          <div className="nav-center">
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
                  const isFinalBossStep = step === 10;
                  const isComplete = step < roundToUse;
                  const isActive = step === round;
                  const isDeathStep = step === deathRound;
                  const isShopRound = isShop && step === round;

                  return (
                    <div
                      key={step}
                      className={[
                        'round-step',
                        isFinalBossStep && 'finalBoss',
                        isBoss && 'boss',
                        isComplete && 'complete',
                        isActive && 'active',
                        isShopRound && 'shop-outline',
                        isDeathStep && 'died',
                      ].filter(Boolean).join(' ')}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="nav-right">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Stage routing */}
      {isDeath ? (
        <DeathScreen />
      ) : isFinished ? (
        <EndScreen
          stats={{ ...stats, time: runTimeString }}
          onPlayAgain={restartRun}
          onMenu={goToMenu}
        />
      ) : isGameLevel ? (
        <SkillsProvider>
          <BoardHelperProvider>
            <GameScreen />
          </BoardHelperProvider>
        </SkillsProvider>
      ) : (
        <SkillsProvider>
          <ShopScreen />
        </SkillsProvider>
      )}
    </div>
  );
}
