// src/contexts/RunStatsContext.tsx
import React, { createContext, useContext, useMemo, useRef, useState } from "react";

const RunStatsContext = createContext(null);

export function RunStatsProvider({ children }) {
  const [guessesUsed, setGuessesUsed] = useState(0);
  const [perksUsed, setPerksUsed] = useState(0);
  const [cashEarnt, setCashEarnt] = useState(0); // only positive earnings

  const [runStartedAt, setRunStartedAt] = useState(() => Date.now());

  const noteGuess = (n = 1) => setGuessesUsed(v => v + n);
  const notePerkUsed = (n = 1) => setPerksUsed(v => v + n);
  const noteCashEarned = (amount = 0) => {
    const n = Math.max(0, Number(amount) || 0);
    if (n) setCashEarnt(v => v + n);
  };

  const resetRunStats = () => {
    setGuessesUsed(0);
    setPerksUsed(0);
    setCashEarnt(0);
    setRunStartedAt(Date.now());
  };

  const stats = useMemo(() => ({
    guessesUsed,
    perksUsed,
    cashEarnt,
    runStartedAt,
  }), [guessesUsed, perksUsed, cashEarnt, runStartedAt]);

  const value = useMemo(() => ({
    stats,
    noteGuess,
    notePerkUsed,
    noteCashEarned,
    resetRunStats,
  }), [stats, noteGuess, notePerkUsed, noteCashEarned, resetRunStats]);

  return <RunStatsContext.Provider value={value}>{children}</RunStatsContext.Provider>;
}

export function useRunStats() {
  const ctx = useContext(RunStatsContext);
  if (!ctx) throw new Error("useRunStats must be used within <RunStatsProvider>");
  return ctx;
}
