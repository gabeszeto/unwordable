// contexts/perks/PerksContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRunStats } from '../RunStatsContext';
import { loadSave, persistSave } from '../../features/save'; // adjust path if needed

const PerksContext = createContext();

export function PerksProvider({ children }) {
  const { notePerkUsed } = useRunStats();

  // Persisted counts (hydrated from save)
  const [perks, setPerks] = useState({});
  // Transient / runtime-only toggles
  const [jybrishActive, setJybrishActive] = useState(false);
  // NEW: staged consumptions that haven't been flushed to save yet
  const [pendingSpends, setPendingSpends] = useState({}); // { perkName: count }

  const hydratedRef = useRef(false);

  // Hydrate once from save
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const save = loadSave();
      if (save?.perks && typeof save.perks === 'object') {
        setPerks(save.perks);
      }
    } catch {}
  }, []);

  // helpers
  const getPerkCount = (name) => Math.max(0, Number(perks?.[name] || 0));
  const hasPerk = (name) => getPerkCount(name) > 0;

  // Add (shop/reward). We persist immediately for acquisitions.
  const addPerk = (perkName, n = 1) => {
    const delta = Math.max(0, Number(n) || 0);
    if (!delta) return;
    setPerks(prev => {
      const next = { ...prev, [perkName]: (prev[perkName] || 0) + delta };
      persistSave({ perks: next });
      return next;
    });
  };

  /**
   * Consume a perk for THIS GUESS ONLY.
   * - Updates React state immediately so UI logic can rely on the spend.
   * - DOES NOT persist to save here.
   * - We stage the spend in `pendingSpends` and
   *   the caller should later call `commitPerkSpends()` on successful submit.
   */
  const usePerk = (perkName) => {
    const current = getPerkCount(perkName);
    if (current <= 0) return false;

    setPerks(prev => {
      const nextCount = Math.max(0, current - 1);
      const next = { ...prev, [perkName]: nextCount };
      if (nextCount === 0) delete next[perkName];
      return next;
    });

    setPendingSpends(prev => ({
      ...prev,
      [perkName]: (prev[perkName] || 0) + 1,
    }));

    // Stats can still tick immediately (or move this to commit if you prefer)
    notePerkUsed(1);
    return true;
  };

  /**
   * Flush staged spends to disk. Call this after a row is submitted.
   */
  const commitPerkSpends = () => {
    if (Object.keys(pendingSpends).length === 0) return;
    // Persist current `perks` snapshot; it already reflects the spends.
    persistSave({ perks });
    setPendingSpends({});
  };

  /**
   * Optional: rollback staged spends (e.g., if you ever cancel a whole guess).
   * Not used by default, but handy to have.
   */
  const rollbackPerkSpends = () => {
    if (Object.keys(pendingSpends).length === 0) return;
    setPerks(prev => {
      const next = { ...prev };
      for (const [name, spent] of Object.entries(pendingSpends)) {
        next[name] = (next[name] || 0) + spent;
      }
      return next;
    });
    setPendingSpends({});
  };

  const resetPerks = () => {
    setPerks({});
    setPendingSpends({});
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

        // mutators
        addPerk,
        usePerk,
        resetPerks,

        // staged I/O
        commitPerkSpends,
        rollbackPerkSpends,

        // transient
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
