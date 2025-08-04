import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function KeyzoneGrid({
  perkKey = 'KeyzoneGrid',
  onKBActivate,
  isKeyzoneUsed,
  markAsUsed,
  remaining,
}) {
  const { perks } = usePerks();
  const used = isKeyzoneUsed;
  const quantity = perks[perkKey] || 0;

  const handleClick = () => {
    if (used || quantity <= 0) return;

    onKBActivate?.('grid');
    markAsUsed(perkKey);
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      #️⃣ Keyzones (Grid) ×{remaining}
    </button>
  );
}

