import React from 'react';
import { useSkills } from '../../contexts/skills/SkillsContext';
import { getAnalysisHint } from './helpers/getAnalysisHint';

export default function AnalysisInfo({ targetWord }) {
  const { getSkillLevel } = useSkills();
  const level = getSkillLevel('Analysis');
  if (!level) return null;

  const hint = getAnalysisHint(targetWord, level);
  if (!hint) return null;

  const { tries, usage } = hint;

  const triesText =
    tries === 7
      ? "didn't guess this word"
      : `guessed this word in ${tries} ${tries === 1 ? 'try' : 'tries'} `;

  return (
    <div className="info-chip">
      <strong>Analysis L{level}:</strong>{' '}
      {`Gabe ${triesText}`}
      {level >= 2 && usage ? (
        <>
          <span title={`${usage.freq?.toFixed?.(2) ?? usage.freq} per million`}>
            and {usage.label}
          </span>
        </>
      ) : null}
    </div>
  );
}

