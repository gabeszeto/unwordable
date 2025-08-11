import { createContext, useContext, useMemo, useRef, useState } from "react";
import { useLevel } from "./level/LevelContext";
import { useDeath } from "./death/DeathContext";

const RunStatsContext = createContext(null);

const BOSS_STEPS_ALL = [3, 6, 9, 10];

export function RunStatsProvider({ children }) {
  // event counters
  const [guessesUsed, setGuessesUsed]   = useState(0);
  const [perksUsed, setPerksUsed]       = useState(0);
  const [cashEarned, setCashEarned]     = useState(0); // +gains -spend
  const [debuffKeysFaced, setDebuffKeysFaced] = useState(() => new Set());

  // timing
  const runStartedAtRef = useRef(Date.now());

  // derive rounds/bosses from Level/Death
  const { stage, getRoundNumber } = useLevel();
  const { deathRound } = useDeath();

  const round = getRoundNumber(stage);
  const roundsSurvived = Math.min(deathRound || round, 10);
  const bossesBeaten = BOSS_STEPS_ALL.filter(n => n <= roundsSurvived).length;

  // event API (call these from gameplay/shop screens)
  const noteGuess = (n = 1) => setGuessesUsed(v => v + n);
  const notePerkUsed = (n = 1) => setPerksUsed(v => v + n);
  const noteCashDelta = (delta) => setCashEarned(v => v + (Number(delta) || 0));
  const noteDebuffsFaced = (keys = []) =>
    setDebuffKeysFaced(prev => {
      const next = new Set(prev);
      keys.forEach(k => next.add(k));
      return next;
    });

  const resetRunStats = () => {
    setGuessesUsed(0);
    setPerksUsed(0);
    setCashEarned(0);
    setDebuffKeysFaced(new Set());
    runStartedAtRef.current = Date.now();
  };

  const stats = useMemo(() => ({
    roundsSurvived,
    bossesBeaten,
    guessesUsed,
    cashEarned,
    perksUsed,
    debuffsFaced: debuffKeysFaced.size,
    runStartedAt: runStartedAtRef.current,
  }), [roundsSurvived, bossesBeaten, guessesUsed, cashEarned, perksUsed, debuffKeysFaced.size]);

  const value = useMemo(() => ({
    // data
    stats,
    // events
    noteGuess,
    notePerkUsed,
    noteCashDelta,
    noteDebuffsFaced,
    resetRunStats,
  }), [stats]);

  return (
    <RunStatsContext.Provider value={value}>
      {children}
    </RunStatsContext.Provider>
  );
}

export function useRunStats() {
  const ctx = useContext(RunStatsContext);
  if (!ctx) throw new Error("useRunStats must be used within <RunStatsProvider>");
  return ctx;
}
