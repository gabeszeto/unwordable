import React, { createContext, useContext, useState, useEffect } from 'react';
import { persistSave, loadSave } from '../../features/save';
import { generateDebuffPlan } from '../../features/debuffs/generateDebuffPlan';

const DebuffsContext = createContext();

export const DebuffsProvider = ({ children }) => {
  const [activeDebuffs, setActiveDebuffs] = useState([]);
  const [passiveDebuffs, setPassiveDebuffs] = useState({});
  const [debuffPlan, setDebuffPlan] = useState({});

  // 🔹 Restore from save on mount
  useEffect(() => {
    const save = loadSave();
    console.log(save)
    if (save?.debuffPlan && Object.keys(save.debuffPlan).length > 0) {
      setDebuffPlan(save.debuffPlan);
    }
    // else: do nothing — let startNewRun / resetAll decide when to generate
  }, []);
  
  const addActiveDebuff = (debuffKey) => {
    setActiveDebuffs((prev) => {
      const updated = prev.includes(debuffKey) ? prev : [...prev, debuffKey];
      persistSave({ debuffPlan }); // persist current plan, active list can be rebuilt from plan
      return updated;
    });
  };

  const addPassiveDebuff = (debuffKey) => {
    setPassiveDebuffs((prev) => {
      const updated = { ...prev, [debuffKey]: (prev[debuffKey] || 0) + 1 };
      persistSave({ debuffPlan, passiveDebuffs: updated });
      return updated;
    });
  };

  const removeActiveDebuff = (debuffKey) => {
    setActiveDebuffs((prev) => prev.filter((key) => key !== debuffKey));
  };

  const removePassiveDebuff = (debuffKey) => {
    setPassiveDebuffs((prev) => {
      const { [debuffKey]: _, ...rest } = prev;
      persistSave({ debuffPlan, passiveDebuffs: rest });
      return rest;
    });
  };

  const clearDebuffs = ({ keepPlan = false } = {}) => {
    setActiveDebuffs([]);
    setPassiveDebuffs({});
    persistSave({
      passiveDebuffs: {},
      ...(keepPlan ? {} : { debuffPlan: {} })
    });
  };
  
  /** Use this when starting a new run */
  const resetDebuffsCompletely = () => {
    clearDebuffs({ keepPlan: false });
  };

  const setDebuffPlanAndSave = (plan) => {
    setDebuffPlan(plan);
    persistSave({ debuffPlan: plan });
  };

  useEffect(() => {
    console.log('[Debuffs] plan hydrated:', debuffPlan);
  }, [debuffPlan]);
  

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
        setDebuffPlan: setDebuffPlanAndSave,
        resetDebuffsCompletely
      }}
    >
      {children}
    </DebuffsContext.Provider>
  );
};

export const useDebuffs = () => useContext(DebuffsContext);
