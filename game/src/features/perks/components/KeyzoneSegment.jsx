// KeyzoneSegment.jsx
import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../usePerkActions';
import useShiftHeld from '../useShiftHeld';

export default function KeyzoneSegment({
  perkKey = 'KeyzoneSegment',
  onKBActivate,
  isKeyzoneUsed,
  markAsUsed,
  remaining,
  setItemDescriptionKey,
}) {
  const { perks } = usePerks();
  const { runPerk } = usePerkActions();
  const shiftHeld = useShiftHeld();

  const quantity = perks[perkKey] || 0;
  const disabled = isKeyzoneUsed || quantity <= 0;

  const handleClick = (e) => {
    if (disabled) return;
    if (e.shiftKey) {
      const res = runPerk(perkKey, {
        onKBActivate,
        isKeyzoneUsed,
        markAsUsed,
      });
      if (!res.ok) console.warn(res.error);
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
      ➗ Keyzones (Segment) ×{remaining}
    </button>
  );
}
