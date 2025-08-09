// src/contexts/skills/SkillsContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { skillsRegistry } from '../../features/skills/skillsRegistry';

const SkillsContext = createContext(null);

export const SkillsProvider = ({ children }) => {
  // { LetterLens: 2, OtherSkill: 1 }
  const [activeSkills, setActiveSkills] = useState({});

  // optional persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('unwordable.activeSkills');
      if (saved) setActiveSkills(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('unwordable.activeSkills', JSON.stringify(activeSkills));
    } catch {}
  }, [activeSkills]);

  const resetSkills = useCallback(() => setActiveSkills({}), []);

  const setSkillLevel = useCallback((key, level) => {
    const max = skillsRegistry[key]?.maxLevel ?? Infinity;
    const clamped = Math.max(0, Math.min(level, max));
    setActiveSkills(prev => ({ ...prev, [key]: clamped }));
  }, []);

  const unlockSkill = useCallback((key, { level = 1 } = {}) => {
    setSkillLevel(key, Math.max(level, activeSkills[key] ?? 0));
  }, [activeSkills, setSkillLevel]);

  const upgradeSkill = useCallback((key, by = 1) => {
    const current = activeSkills[key] ?? 0;
    setSkillLevel(key, current + by);
  }, [activeSkills, setSkillLevel]);

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
