import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import GameScreen from './game/GameScreen';
import ShopScreen from './shop/ShopScreen';

import { useLevel } from '../contexts/level/LevelContext';
import { useDebuffs } from '../contexts/debuffs/DebuffsContext';
import { useDeath } from '../contexts/death/DeathContext';
import { useRunStats } from '../contexts/RunStatsContext';

import { useNavigate } from 'react-router-dom';

import ThemeToggle from './ThemeToggle';

import DeathScreen from './game/DeathScreen';
import EndScreen from './game/EndScreen';

import './gameStageManagerStyles.css';
import { useCorrectness } from '../contexts/CorrectnessContext';
import { BoardHelperProvider } from '../contexts/BoardHelperContext';

import { useRunControls } from './game/useRunControls';

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
  const navigate = useNavigate()
  const { restartRunInGame } = useRunControls();

  // Debuffs
  const {
    addActiveDebuff,
    addPassiveDebuff,
    clearDebuffs,
    debuffPlan,
  } = useDebuffs();

  // Death + correctness
  const { deathRound /*, reason*/ } = useDeath();
  const { resetCorrectness } = useCorrectness();

  // Run stats
  const { stats, resetRunStats } = useRunStats();
  const runKey = stats?.runStartedAt ?? 0;

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

  // const pause = useCallback(() => {
  //   if (isDeath || isFinished || paused) return;
  //   pauseStartedAtRef.current = Date.now();
  //   setPaused(true);
  // }, [isDeath, isFinished, paused]);

  const pause = useCallback((atMs) => {
    if (isDeath || isFinished || paused) return;
    pauseStartedAtRef.current = typeof atMs === 'number' ? atMs : Date.now();
    setPaused(true);
  }, [isDeath, isFinished, paused]);

  const resume = useCallback(() => {
    if (!paused) return;
    if (pauseStartedAtRef.current != null) {
      const delta = Date.now() - pauseStartedAtRef.current;
      setAccumulatedPauseMs(ms => ms + Math.max(0, delta));
      pauseStartedAtRef.current = null;
    }
    setPaused(false);
    setNow(Date.now()); // instant tick
  }, [paused]);

  const togglePause = useCallback(() => {
    if (isDeath || isFinished) return;
    if (paused) resume();
    else pause();
  }, [isDeath, isFinished, paused, pause, resume]);

  // Apply debuffs when stage changes 
  useEffect(() => {
    clearDebuffs({ keepPlan: true });

    const roundPlan = debuffPlan[round];
    if (!roundPlan) return;

    (roundPlan.passive || []).forEach(p => addPassiveDebuff(p));
    (roundPlan.active || []).forEach(a => addActiveDebuff(a));

  }, [stage, debuffPlan, round]);

  // Reset correctness each new GAME round
  useEffect(() => {
    if (isGameLevel) resetCorrectness();
  }, [isGameLevel, resetCorrectness]);

  // Round visuals
  const roundToUse = isDeath ? deathRound : round;
  const BOSS_STEPS = [3, 6, 9];
  const isBossRound = BOSS_STEPS.includes(roundToUse);
  const isFinalBoss = roundToUse === 10;
  const isShopThisRound = isShop && roundToUse === round;

  const restartRun = () => {
    // your local “pause” bits:
    setPaused(false);
    pauseStartedAtRef.current = null;
    setAccumulatedPauseMs(0);

    // centralized reset:
    restartRunInGame({
      onResetLocalTimers: null /* we already reset above, but you could pass a function here instead */
    });
  };

  // Block keydown
  const handleKeyDownCapture = useCallback((e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      togglePause(); // toggle whether paused or not
      return;
    }

    if (!paused) return;

    // If paused, block everything else
    e.preventDefault();
    e.stopPropagation();
  }, [paused, togglePause]);

  // Space to pause and unpause
  useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in fields
      const el = e.target;
      const isEditable =
        el?.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName);

      if (isEditable) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        togglePause(); // uses your pause/resume math
      }
    };
    window.addEventListener('keydown', onKey, true); // capture
    return () => window.removeEventListener('keydown', onKey, true);
  }, [togglePause]);


  const goToMenu = () => {
    navigate('/')
  }

  // Defer on Safari to avoid stealing focus back to this tab.
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
      // Safari: capture the time on blur, then pause after 2x rAF so the tab switch can finish.
      const onBlur = () => {
        const leftAt = Date.now();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            pause(leftAt); // use captured timestamp
          });
        });
      };
      window.addEventListener('blur', onBlur);
      return () => window.removeEventListener('blur', onBlur);
    } else {
      // Others: pause immediately when hidden / pagehide
      const onVis = () => {
        if (document.visibilityState === 'hidden') {
          pause(Date.now());
        }
      };
      const onPageHide = () => pause(Date.now());

      document.addEventListener('visibilitychange', onVis, { passive: true });
      window.addEventListener('pagehide', onPageHide, { passive: true });

      return () => {
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('pagehide', onPageHide);
      };
    }
  }, [pause]);

  return (
    <div className="gameContainer" onKeyDownCapture={handleKeyDownCapture}>
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
                    const isDeathStep = isDeath && step === deathRound;
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
          <div className="gamePointsDisplay"></div>
        </div>
      </div>

      {/* Game Menu  */}
      {paused && (
        <div className="pauseOverlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <div className="pauseCard">
            <div id="pause-title" className="pauseTitle">Paused</div>
            <div className="pauseSub">Press <kbd>Space</kbd> or click Resume</div>
            <div className="pauseActions">
              <button className="pauseBtn primary" onClick={resume}>▶︎ Resume</button>
              <button className="pauseBtn" onClick={restartRun}>↺ Restart Run</button>
              <button className="pauseBtn" onClick={goToMenu}>☰ Main Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Stage routing */}
      {isDeath ? (
        <DeathScreen
          time={runTimeString}              // optional pretty time from the parent
          onPlayAgain={restartRun}
          onMenu={goToMenu}
        />
      ) : isFinished ? (
        <EndScreen
          stats={{ ...stats, time: runTimeString }}
          onPlayAgain={restartRun}
          onMenu={goToMenu}
        />
      ) : isGameLevel ? (
        <BoardHelperProvider>
          <GameScreen key={runKey}paused={paused} />
        </BoardHelperProvider>
      ) : (
        <ShopScreen />
      )}
    </div>
  );
}
