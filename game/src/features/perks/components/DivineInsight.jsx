import React from 'react';
import '../perks.css'

export default function DivineInsight({ targetWord, revealedIndices, setRevealedIndices, used, setUsed }) {
  const handleClick = () => {
    if (used) return;

    const unrevealed = [...targetWord]
      .map((_, i) => (revealedIndices.includes(i) ? null : i))
      .filter(i => i !== null);

    if (unrevealed.length === 0) return;

    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    setRevealedIndices([...revealedIndices, randomIndex]);
    setUsed(true);
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used}>
      Divine Insight 🔮
    </button>
  );
}
