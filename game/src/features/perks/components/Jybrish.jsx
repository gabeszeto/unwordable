import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function Jybrish({
  perkKey = 'Jybrish',
  usedPerks,
  markAsUsed,
  remaining,
}) {
  const { perks, usePerk, activateJybrish } = usePerks();
  const used = usedPerks.includes(perkKey);
  const quantity = perks[perkKey] || 0;

  const handleClick = () => {
    if (used || quantity <= 0) return;

    activateJybrish()
    markAsUsed(perkKey);
    usePerk(perkKey)
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      ♒️ Jybrish ×{remaining}
    </button>
  );
}

