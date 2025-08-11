// src/features/perks/components/DeadKeys.jsx
import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../usePerkActions';
import useShiftHeld from '../useShiftHeld';

export default function DeadKeys({
  perkKey = 'DeadKeys',
  usedPerks,
  markAsUsed,
  remaining,

  // from sharedProps
  targetWord,
  usedKeys,
  setUsedKeys,
  setItemDescriptionKey,
}) {
  const { perks } = usePerks();
  const { runPerk } = usePerkActions();
  const shiftHeld = useShiftHeld();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);
  const disabled = used || quantity <= 0;

  const handleClick = (e) => {
    if (disabled) return;

    if (e.shiftKey) {
      const res = runPerk(perkKey, {
        targetWord,
        usedKeys,
        setUsedKeys,
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
      ⬜️ Dead Keys ×{remaining}
    </button>
  );
}
