// contexts/death/DeathContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const DEFAULT = { deathRound: null, reason: null, word: '' };

const DeathContext = createContext({
  ...DEFAULT,
  setDeathInfo: () => {},
  resetDeath: () => {},
});

export const DeathProvider = ({ children }) => {
  const [deathInfo, setDeathInfo] = useState(DEFAULT);

  const resetDeath = useCallback(() => {
    setDeathInfo(DEFAULT);
  }, []);

  return (
    <DeathContext.Provider value={{ ...deathInfo, setDeathInfo, resetDeath }}>
      {children}
    </DeathContext.Provider>
  );
};

export const useDeath = () => useContext(DeathContext);
