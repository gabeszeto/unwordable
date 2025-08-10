// cash/CashContext.js
import React, { createContext, useContext, useState } from 'react';

const CashContext = createContext();

export function useCash() {
  return useContext(CashContext);
}

export function CashProvider({ children }) {
  const [cash, setCash] = useState(5);

  // Track a single pending wager at a time
  const [pendingWager, setPendingWager] = useState(null); 
  // shape: { stake: number, payout: number }

  const addCash = (amount) => setCash((g) => g + amount);
  const spendCash = (amount) => setCash((g) => Math.max(g - amount, 0));
  const resetCash = () => setCash(0);

  // Place a wager: immediately deduct stake.
  // On win, you'll add back (stake + payout) to net +payout overall.
  const placeWager = ({ stake = 5, payout = 5 } = {}) => {
    if (pendingWager) return false;           // only one active wager
    if (cash < stake) return false;           // can’t afford
    spendCash(stake);                         // deduct now
    setPendingWager({ stake, payout });
    return true;
  };

  // Resolve after the very next guess is judged
  const resolveWager = (didWin) => {
    if (!pendingWager) return;
    const { stake, payout } = pendingWager;
    if (didWin) {
      // Return stake + profit so net = +payout
      addCash(stake + payout);
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
