import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import GameScreen from './game/GameScreen';
import ShopScreen from './shop/ShopScreen';

import { useLevel } from '../contexts/level/LevelContext';
import { useDebuffs } from '../contexts/debuffs/DebuffsContext';
import { useDeath } from '../contexts/death/DeathContext';
import { useRunStats } from '../contexts/RunStatsContext';

import { useNavigate } from 'react-router-dom';

import ThemeToggle from './ThemeToggle';
import { generateDebuffPlan, generateDebugDebuffPlan } from './debuffs/generateDebuffPlan';

import DeathScreen from './game/DeathScreen';
import EndScreen from './game/EndScreen';

import './gameStageManagerStyles.css';
import { useCorrectness } from '../contexts/CorrectnessContext';
import { BoardHelperProvider } from '../contexts/BoardHelperContext';
import { SkillsProvider } from '../contexts/skills/SkillsContext';

import { Menu } from 'lucide-react';

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
  const { stats, resetRunStats } = useRunStats();

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

  // Pause time
  const [paused, setPaused] = useState(false);
  const pauseStartedAtRef = useRef(null);
  const [accumulatedPauseMs, setAccumulatedPauseMs] = useState(0);
  const [now, setNow] = useState(Date.now());

  const startMs = useMemo(() => {
    const raw = stats?.runStartedAt;
    if (!raw) return null;
    const n = typeof raw === 'number' ? raw : new Date(raw).valueOf();
    return Number.isFinite(n) ? n : null;
  }, [stats?.runStartedAt]);

  const togglePause = useCallback(() => {
    if (isDeath || isFinished) return;
    setPaused(p => {
      const next = !p;
      console.log('[pause] toggle ->', { from: p, to: next, now: Date.now() });
      if (next) {
        pauseStartedAtRef.current = Date.now();
        // console.log('[pause] startedAt <-', pauseStartedAtRef.current);
      } else if (pauseStartedAtRef.current) {
        const delta = Date.now() - pauseStartedAtRef.current;
        setAccumulatedPauseMs(ms => {
          const newTotal = ms + delta;
          // console.log('[pause] resume; add delta', { delta, prev: ms, newTotal });
          return newTotal;
        });
        pauseStartedAtRef.current = null;
        setNow(Date.now()); // tick immediately
      }
      return next;
    });
  }, [isDeath, isFinished]);

  // Timer
  useEffect(() => {
    if (!startMs || isDeath || isFinished || paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startMs, isDeath, isFinished, paused]);

  // Format mm:ss (00-padded)
  const runTimeString = useMemo(() => {
    if (!startMs) return '00:00';
    // if paused, freeze the clock at the moment we paused
    const effectiveNow = paused && pauseStartedAtRef.current ? pauseStartedAtRef.current : now;
    const totalMs = Math.max(0, effectiveNow - startMs - accumulatedPauseMs);
    const m = Math.floor(totalMs / 60000);
    const s = Math.floor((totalMs % 60000) / 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [startMs, now, paused, accumulatedPauseMs]);

  // Apply debuffs when stage changes 
  useEffect(() => {
    clearDebuffs();

    const roundPlan = debuffPlan[round];
    if (!roundPlan) return;

    (roundPlan.passive || []).forEach(p => addPassiveDebuff(p));
    (roundPlan.active || []).forEach(a => addActiveDebuff(a));

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

  }, [stage, debuffPlan, round]);


  // Round visuals
  const roundToUse = isDeath ? deathRound : round;
  const BOSS_STEPS = [3, 6, 9];
  const isBossRound = BOSS_STEPS.includes(roundToUse);
  const isFinalBoss = roundToUse === 10;
  const isShopThisRound = isShop && roundToUse === round;


  // Restart handler
  const restartRun = () => {
    setPaused(false);
    pauseStartedAtRef.current = null;
    setAccumulatedPauseMs(0);

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
      <div className="gameTopPart">
        <div className="navBar">
          <div className="roundInfo">
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
          </div>
          <div className="navContent">
            <div className="nav-left">
              <Menu className="menuButton" onClick={togglePause} />
            </div>
            <div className="nav-center">
              <div className="round-visual">
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
          {/* Points and timer display */}
        </div>
        <div className="pointsTimerDisplay">
          <div className="gameTimerDisplay">{runTimeString}</div>
          <div className="gamePointsDisplay">2,346</div>
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
