import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';
import useShiftHeld from '../useShiftHeld';

export default function Jybrish({
  perkKey = 'Jybrish',
  usedPerks,
  markAsUsed,
  remaining,
  setItemDescriptionKey
}) {
  const { perks, usePerk, activateJybrish } = usePerks();
  const shiftHeld = useShiftHeld();
  const used = usedPerks.includes(perkKey);
  const quantity = perks[perkKey] || 0;
  const disabled = used || quantity <= 0;

  const activate = () => {
    if (disabled) return;
    activateJybrish()
    markAsUsed(perkKey);
    usePerk(perkKey);
  };

  const handleClick = (e) => {
    if (disabled) return;
    if (e.shiftKey) {
      // Shift+Click -> use it
      activate();
    } else {
      // Click -> show info
      setItemDescriptionKey('Jybrish')
    }
  };

  return (
    <button
      className={`perk-button ${shiftHeld ? 'perk-shift-held' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      ♒️ Jybrish ×{remaining}
    </button>
  );
}

