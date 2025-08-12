// cash/CashContext.js
import React, { createContext, useContext, useState } from 'react';
import { useRunStats } from '../RunStatsContext';

const CashContext = createContext();
export function useCash() {
  return useContext(CashContext);
}

export function CashProvider({ children }) {
  const [cash, setCash] = useState(5);
  const [pendingWager, setPendingWager] = useState(null);
  const { noteCashEarned } = useRunStats();

  // Internal helper: add cash without affecting stats
  const addCashRaw = (amount) => setCash(g => g + amount);

  // Public method: add cash and track as earnings
  const addCash = (amount) => {
    const n = Number(amount) || 0;
    if (!n) return;
    addCashRaw(n);
    noteCashEarned(n);
  };

  const spendCash = (amount) => setCash(g => Math.max(g - amount, 0));
  const resetCash = () => setCash(0);

  const placeWager = ({ stake = 5, payout = 5 } = {}) => {
    if (pendingWager) return false;
    if (cash < stake) return false;
    spendCash(stake);
    setPendingWager({ stake, payout });
    return true;
  };

  const resolveWager = (didWin) => {
    if (!pendingWager) return;
    const { stake, payout } = pendingWager;
    if (didWin) {
      // Return stake without counting as new earnings
      addCashRaw(stake);
      // Count only the payout as earnings
      addCash(payout);
    }
    setPendingWager(null);
  };

  return (
    <CashContext.Provider
      value={{
        cash,
        addCash,
        spendCash,
        resetCash,
        pendingWager,
        placeWager,
        resolveWager,
      }}
    >
      {children}
    </CashContext.Provider>
  );
}
