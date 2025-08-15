// src/contexts/debuffs/DebuffsContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { persistSave, loadSave } from '../../features/save';     // 👈 unify path

const DebuffsContext = createContext();

export const DebuffsProvider = ({ children }) => {
  const [activeDebuffs, setActiveDebuffs] = useState([]);
  const [passiveDebuffs, setPassiveDebuffs] = useState({});
  const [debuffPlan, setDebuffPlan] = useState({});
  const hydratedRef = useRef(false);

  // Hydrate once
  useEffect(() => {
    const save = loadSave();
    if (save?.debuffPlan && Object.keys(save.debuffPlan).length > 0) {
      setDebuffPlan(save.debuffPlan);
    }
    hydratedRef.current = true;
  }, []);

  const addActiveDebuff = (debuffKey) => {
    setActiveDebuffs(prev => {
      const updated = prev.includes(debuffKey) ? prev : [...prev, debuffKey];
      if (hydratedRef.current) persistSave({ debuffPlan }); // persist plan, not the volatile active list
      return updated;
    });
  };

  const addPassiveDebuff = (debuffKey) => {
    setPassiveDebuffs(prev => {
      const updated = { ...prev, [debuffKey]: (prev[debuffKey] || 0) + 1 };
      if (hydratedRef.current) persistSave({ debuffPlan, passiveDebuffs: updated });
      return updated;
    });
  };

  const removeActiveDebuff = (debuffKey) => {
    setActiveDebuffs(prev => prev.filter(k => k !== debuffKey));
  };

  const removePassiveDebuff = (debuffKey) => {
    setPassiveDebuffs(prev => {
      const { [debuffKey]: _, ...rest } = prev;
      if (hydratedRef.current) persistSave({ debuffPlan, passiveDebuffs: rest });
      return rest;
    });
  };

  // Clear between stages, optionally keeping the plan
  const clearDebuffs = ({ keepPlan = false } = {}) => {
    setActiveDebuffs([]);
    setPassiveDebuffs({});
    if (!hydratedRef.current) return; // 👈 don’t write during hydration
    persistSave({
      passiveDebuffs: {},
      ...(keepPlan ? {} : { debuffPlan: {} }),
    });
  };

  const resetDebuffsCompletely = () => clearDebuffs({ keepPlan: false });

  const setDebuffPlanAndSave = (plan) => {
    setDebuffPlan(plan);
    if (hydratedRef.current) persistSave({ debuffPlan: plan });
  };

  return (
    <DebuffsContext.Provider value={{
      activeDebuffs,
      passiveDebuffs,
      addActiveDebuff,
      addPassiveDebuff,
      removeActiveDebuff,
      removePassiveDebuff,
      clearDebuffs,
      resetDebuffsCompletely,
      debuffPlan,
      setDebuffPlan: setDebuffPlanAndSave,
    }}>
      {children}
    </DebuffsContext.Provider>
  );
};

export const useDebuffs = () => useContext(DebuffsContext);
