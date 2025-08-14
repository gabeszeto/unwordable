// contexts/perks/PerksContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRunStats } from '../RunStatsContext';
import { loadSave, persistSave } from '../../features/save'; // <-- adjust path if needed

const PerksContext = createContext();

export function PerksProvider({ children }) {
  const { notePerkUsed } = useRunStats();

  // Only persist the counts object in save.perks
  const [perks, setPerks] = useState({});
  // Transient runtime-only state
  const [jybrishActive, setJybrishActive] = useState(false);

  // Avoid re-hydrating twice in StrictMode dev
  const hydratedRef = useRef(false);

  // Hydrate from save once
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const save = loadSave();
      if (save?.perks && typeof save.perks === 'object') {
        setPerks(save.perks);
      }
    } catch {
      // ignore malformed saves
    }
  }, []);

  // Helpers
  const getPerkCount = (name) => Math.max(0, Number(perks?.[name] || 0));
  const hasPerk = (name) => getPerkCount(name) > 0;

  // Mutators (these also persist)
  const addPerk = (perkName, n = 1) => {
    const delta = Math.max(0, Number(n) || 0);
    if (!delta) return;
    setPerks(prev => {
      const next = { ...prev, [perkName]: getPerkCount(perkName) + delta };
      persistSave({ perks: next });
      return next;
    });
  };

  /**
   * Attempts to consume a perk. Returns true if one was spent.
   * Only calls notePerkUsed when a spend actually happened.
   */
  const usePerk = (perkName) => {
    const current = getPerkCount(perkName);
    if (current <= 0) return false;

    setPerks(prev => {
      const nextCount = Math.max(0, current - 1);
      const next = { ...prev, [perkName]: nextCount };
      if (nextCount === 0) delete next[perkName]; // keep the object tidy
      persistSave({ perks: next });
      return next;
    });

    notePerkUsed(1);
    return true;
  };

  const resetPerks = () => {
    setPerks({});
    setJybrishActive(false);
    persistSave({ perks: {} });
  };

  // Transient toggles (not persisted)
  const activateJybrish = () => setJybrishActive(true);
  const consumeJybrish = () => setJybrishActive(false);

  return (
    <PerksContext.Provider
      value={{
        // data
        perks,
        getPerkCount,
        hasPerk,

        // mutators (persist)
        addPerk,
        usePerk,
        resetPerks,

        // transient state
        jybrishActive,
        activateJybrish,
        consumeJybrish,
      }}
    >
      {children}
    </PerksContext.Provider>
  );
}

export const usePerks = () => useContext(PerksContext);
