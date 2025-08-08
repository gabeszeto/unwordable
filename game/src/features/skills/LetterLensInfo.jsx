// src/features/skills/ui/LetterLensInfo.jsx
import React from 'react';
import { useSkills } from '../../contexts/skills/SkillsContext';
import { getLetterLensHint } from './helpers/getLetterLensHint';

export default function LetterLensInfo({ targetWord }) {
  const { getSkillLevel } = useSkills();
  const level = getSkillLevel('LetterLens');
  if (!level) return null;

  const hint = getLetterLensHint(targetWord, level);
  if (!hint) return null;

  return (
    <div className="info-chip">
      <strong>Letter Lens L{level}:</strong>{' '}
      {hint.first && `First is ${hint.first}`}
      {hint.first && hint.last ? ' · ' : ''}
      {hint.last && `Last is ${hint.last}`}
    </div>
  );
}
