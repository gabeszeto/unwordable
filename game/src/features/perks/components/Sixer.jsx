// src/features/perks/components/Sixer.jsx
import '../perks.css';
import useShiftHeld from '../useShiftHeld';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../usePerkActions';

export default function Sixer({
  perkKey = 'Sixer',
  usedPerks,
  markAsUsed,
  remaining,
  setSixerMode,
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
        setSixerMode,
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
      6️⃣ Sixer ×{remaining}
    </button>
  );
}
