import React, { createContext, useContext, useState } from 'react';

const DebuffsContext = createContext();

export const DebuffsProvider = ({ children }) => {
  const [activeDebuffs, setActiveDebuffs] = useState([]);

  const addDebuff = (debuffKey) => {
    setActiveDebuffs((prev) =>
      prev.includes(debuffKey) ? prev : [...prev, debuffKey]
    );
  };

  const removeDebuff = (debuffKey) => {
    setActiveDebuffs((prev) => prev.filter((key) => key !== debuffKey));
  };

  const clearDebuffs = () => setActiveDebuffs([]);

  console.log(activeDebuffs)

  return (
    <DebuffsContext.Provider
      value={{ activeDebuffs, addDebuff, removeDebuff, clearDebuffs }}
    >
      {children}
    </DebuffsContext.Provider>
  );
};

export const useDebuffs = () => useContext(DebuffsContext);
