import React, { createContext, useContext, useState } from 'react';

const DebuffsContext = createContext();

export const DebuffsProvider = ({ children }) => {
  const [activeDebuffs, setActiveDebuffs] = useState([]);
  const [passiveDebuffs, setPassiveDebuffs] = useState({});

  const [debuffPlan, setDebuffPlan] = useState({});

  const addActiveDebuff = (debuffKey) => {
    setActiveDebuffs((prev) =>
      prev.includes(debuffKey) ? prev : [...prev, debuffKey]
    );
  };

  const addPassiveDebuff = (debuffKey) => {
    setPassiveDebuffs((prev) => {
      const current = prev[debuffKey] || 0;
      return {
        ...prev,
        [debuffKey]: current + 1,
      };
    });
  };

  const removeActiveDebuff = (debuffKey) => {
    setActiveDebuffs((prev) => prev.filter((key) => key !== debuffKey));
  };

  const removePassiveDebuff = (debuffKey) => {
    setPassiveDebuffs((prev) => {
      const { [debuffKey]: _, ...rest } = prev;
      return rest;
    });
  };

  const clearDebuffs = () => {
    setActiveDebuffs([]);
    setPassiveDebuffs({});
  };

  console.log({ activeDebuffs, passiveDebuffs });

  return (
    <DebuffsContext.Provider
      value={{
        activeDebuffs,
        passiveDebuffs,
        addActiveDebuff,
        addPassiveDebuff,
        removeActiveDebuff,
        removePassiveDebuff,
        clearDebuffs,
        debuffPlan,
        setDebuffPlan
      }}
    >
      {children}
    </DebuffsContext.Provider>
  );
};

export const useDebuffs = () => useContext(DebuffsContext);
