import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../usePerkActions';
import useShiftHeld from '../useShiftHeld';

export default function Jybrish({
  perkKey = 'Jybrish',
  usedPerks,
  markAsUsed,
  remaining,
  setItemDescriptionKey,
}) {
  const { perks } = usePerks();
  const { runPerk } = usePerkActions();
  const shiftHeld = useShiftHeld();

  const used = usedPerks.includes(perkKey);
  const quantity = perks[perkKey] || 0;
  const disabled = used || quantity <= 0;

  const handleClick = (e) => {
    if (disabled) return;

    if (e.shiftKey) {
      // Shift+Click -> directly use it
      runPerk(perkKey, { markAsUsed });
    } else {
      // Click -> show info panel for Jybrish
      setItemDescriptionKey(perkKey);
    }
  };

  return (
    <button
      className={`perk-button ${shiftHeld && !disabled ? 'perk-shift-held' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      ♒️ Jybrish ×{remaining}
    </button>
  );
}
