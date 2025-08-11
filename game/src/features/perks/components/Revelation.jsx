// src/features/perks/components/Revelation.jsx
import '../perks.css';
import useShiftHeld from '../useShiftHeld';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../usePerkActions';

export default function Revelation({
  perkKey = 'Revelation',
  usedPerks,
  markAsUsed,
  remaining,
  guesses,
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
        guesses,
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
      🔮 Revelation ×{remaining}
    </button>
  );
}
