import React from 'react';
import { useSkills } from '../../contexts/skills/SkillsContext';
import { getRepeaterHint } from './helpers/getRepeaterHint';

export default function RepeaterInfo({ targetWord }) {
  const { getSkillLevel } = useSkills();
  const level = getSkillLevel('Repeater');
  if (!level) return null;

  const hint = getRepeaterHint(targetWord, level);
  if (!hint) return null;

  const { anyRepeat, repeatDistinctCount } = hint;

  // Number-to-word mapping
  const numWords = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four' };
  const countWord = numWords[repeatDistinctCount] || repeatDistinctCount;

  return (
    <div className="info-chip">
      <strong>Repeater L{level}:</strong>{' '}
      {level === 1 && (anyRepeat ? 'At least one letter repeats' : 'All letters are unique')}
      {level >= 2 && (
        anyRepeat
          ? `${countWord} ${repeatDistinctCount === 1 ? 'letter repeats' : 'letters repeat'}`
          : 'All letters are unique'
      )}
    </div>
  );
}
