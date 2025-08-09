// src/features/skills/ui/InsightInfo.jsx
import React from 'react';
import { useSkills } from '../../contexts/skills/SkillsContext';
import { getInsightHint } from './helpers/getInsightHint';

export default function InsightInfo({ targetWord }) {
  const { getSkillLevel } = useSkills();
  const level = getSkillLevel('Insight');
  if (!level) return null;

  const hint = getInsightHint(targetWord, level);
  if (!hint) return null;

  const { tries, usage } = hint;

  const triesText =
    tries === 7
      ? "didn't guess this word"
      : `guessed this word in ${tries} ${tries === 1 ? 'try' : 'tries'} `;

  return (
    <div className="info-chip">
      <strong>Insight L{level}:</strong>{' '}
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

