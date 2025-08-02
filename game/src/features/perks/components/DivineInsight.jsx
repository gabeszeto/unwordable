import React from 'react';
import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function DivineInsight({ targetWord, revealedIndices, setRevealedIndices }) {
  const { perks, usePerk } = usePerks();

  const handleClick = () => {
    if ((perks.divineInsight || 0) === 0) return;

    const unrevealed = [...targetWord]
      .map((_, i) => (revealedIndices.includes(i) ? null : i))
      .filter(i => i !== null);

    if (unrevealed.length === 0) return;

    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    setRevealedIndices([...revealedIndices, randomIndex]);
    usePerk('divineInsight');
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={(perks.divineInsight || 0) === 0}>
      Divine Insight 🔮
    </button>
  );
}
