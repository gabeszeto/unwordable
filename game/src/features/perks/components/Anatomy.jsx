import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';
import useShiftHeld from '../useShiftHeld';
import { usePerkActions } from '../usePerkActions';

export default function Anatomy({
  perkKey = 'Anatomy',
  usedPerks,
  remaining,
  setItemDescriptionKey,
  markAsUsed,
  setInfoPerkKey,
  setShowInfoPanel
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
      // Use the perk via centralized logic
      const res = runPerk(perkKey, { markAsUsed, setInfoPerkKey, setShowInfoPanel });
      if (!res.ok) {
        console.warn(res.error);
      }
    } else {
      // Open description panel
      setItemDescriptionKey?.('Anatomy');
    }
  };

  return (
    <button
      className={`perk-button ${shiftHeld && !disabled ? 'perk-shift-held' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title="Click: details • Shift+Click: use"
    >
      🧪 Anatomy ×{remaining}
    </button>
  );
}
