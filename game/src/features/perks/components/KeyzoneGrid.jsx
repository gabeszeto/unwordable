import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';
import useShiftHeld from '../useShiftHeld';

export default function KeyzoneGrid({
  perkKey = 'KeyzoneGrid',
  onKBActivate,
  isKeyzoneUsed,
  markAsUsed,
  remaining,
  setItemDescriptionKey, // ← normal click opens item description
}) {
  const { perks, usePerk } = usePerks();
  const shiftHeld = useShiftHeld();

  const quantity = perks[perkKey] || 0;
  const disabled = isKeyzoneUsed || quantity <= 0;

  const activate = () => {
    if (disabled) return;
    onKBActivate?.('grid');
    markAsUsed(perkKey);
    usePerk(perkKey);
  };

  const handleClick = (e) => {
    if (disabled) return;
    if (e.shiftKey) {
      activate();
    } else {
      setItemDescriptionKey?.(perkKey);
    }
  };

  return (
    <button
      className={`perk-button ${shiftHeld ? 'perk-shift-held' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title="Click for details · Shift+Click to use"
    >
      #️⃣ Keyzones (Grid) ×{remaining}
    </button>
  );
}
