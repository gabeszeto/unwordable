// gold/GoldContext.js
import React, { createContext, useContext, useState } from 'react';

const GoldContext = createContext();

export function useGold() {
  return useContext(GoldContext);
}

export function GoldProvider({ children }) {
  const [gold, setGold] = useState(5);

  const addGold = (amount) => setGold((g) => g + amount);
  const spendGold = (amount) => setGold((g) => Math.max(g - amount, 0));
  const resetGold = () => setGold(0);

  return (
    <GoldContext.Provider value={{ gold, addGold, spendGold, resetGold }}>
      {children}
    </GoldContext.Provider>
  );
}
