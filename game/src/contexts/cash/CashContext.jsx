// cash/CashContext.js
import React, { createContext, useContext, useState } from 'react';

const CashContext = createContext();

export function useCash() {
  return useContext(CashContext);
}

export function CashProvider({ children }) {
  const [cash, setCash] = useState(5);

  const addCash = (amount) => setCash((g) => g + amount);
  const spendCash = (amount) => setCash((g) => Math.max(g - amount, 0));
  const resetCash = () => setCash(0);

  return (
    <CashContext.Provider value={{ cash, addCash, spendCash, resetCash }}>
      {children}
    </CashContext.Provider>
  );
}
