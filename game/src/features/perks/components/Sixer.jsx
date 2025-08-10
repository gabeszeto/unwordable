// Sixer.jsx
import '../perks.css';
import useShiftHeld from '../useShiftHeld';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function Sixer({
  perkKey = 'Sixer',
  usedPerks,
  markAsUsed,
  remaining,
  setSixerMode,
  setItemDescriptionKey, // 👈 add this
}) {
  const { perks, usePerk } = usePerks();
  const shiftHeld = useShiftHeld();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);
  const disabled = used || quantity <= 0;

  const activate = () => {
    if (disabled) return;
    setSixerMode(true);      // turn on Sixer UI display
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
      6️⃣ Sixer ×{remaining}
    </button>
  );
}
