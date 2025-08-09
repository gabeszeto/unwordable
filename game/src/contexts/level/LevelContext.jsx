// contexts/level/LevelContext.jsx
import { createContext, useContext, useState, useMemo } from 'react';

const LevelContext = createContext();

export function LevelProvider({ children }) {
  const [stage, setStage] = useState(0);         // Stage 0 = Round 1
  const [guessBank, setGuessBank] = useState(0); // ⬅️ survives shop screens

  const advanceStage = () => setStage(prev => prev + 1);

  const isBossStage = (s) => [4, 10, 16, 18].includes(s);
  const isGameStage = (s) => s % 2 === 0;        // even stages are gameplay
  const getRoundNumber = (s) => Math.floor(s / 2) + 1;
  const resetLevel = () => {
    setStage(0);
    setGuessBank(0);
  };

  // Borrowed Time interface
  const bankGuess = (n = 1, cap = 6) => {
    setGuessBank(b => Math.min(cap, b + n));
  };

  // Consume only when a GAME stage starts (caller decides when to call this)
  const consumeGuessBank = () => {
    const v = guessBank;
    if (v) setGuessBank(0);
    return v;
  };

  const value = useMemo(() => ({
    stage,
    setStage,
    resetLevel,
    advanceStage,
    isBossStage,
    isGameStage,
    getRoundNumber,

    // Borrowed Time API
    guessBank,
    bankGuess,
    consumeGuessBank,
  }), [stage, guessBank]);

  return (
    <LevelContext.Provider value={value}>
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  return useContext(LevelContext);
}
