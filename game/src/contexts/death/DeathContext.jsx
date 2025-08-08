import React, { createContext, useContext, useState } from 'react';

const DeathContext = createContext();

export const DeathProvider = ({ children }) => {
  const [deathInfo, setDeathInfo] = useState({ deathRound: 0, reason: null, word: '' });
  return (
    <DeathContext.Provider value={{ ...deathInfo, setDeathInfo }}>
      {children}
    </DeathContext.Provider>
  );
};

export const useDeath = () => useContext(DeathContext);