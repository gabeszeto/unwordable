import { createContext, useContext, useState } from 'react';

const LevelContext = createContext();

export function LevelProvider({ children }) {
  const [stage, setStage] = useState(0); // Stage 0 = Round 1

  const advanceStage = () => setStage(prev => prev + 1);

  const isBossStage = stage => [4, 10, 16, 18].includes(stage);
  const isGameStage = stage => stage % 2 === 0;
  const getRoundNumber = stage => Math.floor(stage / 2) + 1;
  const resetLevel = () => setStage(0)

  return (
    <LevelContext.Provider value={{
      stage,
      setStage,
      resetLevel,
      advanceStage,
      isBossStage,
      isGameStage,
      getRoundNumber,
    }}>
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  return useContext(LevelContext);
}
