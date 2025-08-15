import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { skillsRegistry } from '../../features/skills/skillsRegistry';
import { loadSave, persistSave } from '../../features/save';

const SkillsContext = createContext(null);

export const SkillsProvider = ({ children }) => {
  // ✅ hydrate synchronously on first render
  const [activeSkills, setActiveSkills] = useState(() => {
    const save = loadSave();
    return (save?.skills && typeof save.skills === 'object') ? save.skills : {};
  });

  // Persist whenever skills change
  useEffect(() => {
    persistSave({ skills: activeSkills }, 'SkillsProvider:skills');
  }, [activeSkills]);

  const resetSkills = useCallback(() => setActiveSkills({}), []);

  const setSkillLevel = useCallback((key, level) => {
    const max = skillsRegistry[key]?.maxLevel ?? Infinity;
    const clamped = Math.max(0, Math.min(level, max));
    setActiveSkills(prev => ({ ...prev, [key]: clamped }));
  }, []);

  const unlockSkill = useCallback((key, { level = 1 } = {}) => {
    setActiveSkills(prev => {
      const current = prev[key] ?? 0;
      const max = skillsRegistry[key]?.maxLevel ?? Infinity;
      const next = Math.max(level, current);
      return { ...prev, [key]: Math.min(next, max) };
    });
  }, []);

  const upgradeSkill = useCallback((key, by = 1) => {
    setActiveSkills(prev => {
      const current = prev[key] ?? 0;
      const max = skillsRegistry[key]?.maxLevel ?? Infinity;
      return { ...prev, [key]: Math.min(current + by, max) };
    });
  }, []);

  const getSkillLevel = useCallback((key) => activeSkills[key] ?? 0, [activeSkills]);

  return (
    <SkillsContext.Provider value={{
      activeSkills,
      getSkillLevel,
      setSkillLevel,
      unlockSkill,
      upgradeSkill,
      resetSkills,
      skillsRegistry,
    }}>
      {children}
    </SkillsContext.Provider>
  );
};

export const useSkills = () => useContext(SkillsContext);
