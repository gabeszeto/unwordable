import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function Anatomy({
  perkKey = 'Anatomy',
  usedPerks,
  markAsUsed,
  remaining,
  setInfoPerkKey,
  setItemDescriptionKey
}) {
  const { perks, usePerk } = usePerks();
  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);
  const disabled = used || quantity <= 0;

  const activate = () => {
    if (disabled) return;
    markAsUsed(perkKey);
    usePerk(perkKey);
    setInfoPerkKey?.(perkKey);
  };

  const handleClick = (e) => {
    if (disabled) return;
    if (e.shiftKey) {
      // Shift+Click -> use it
      activate();
    } else {
      // Click -> show info
      setItemDescriptionKey('Anatomy')
    }
  };

  return (
    <button
      className="perk-button"
      onClick={handleClick}
      disabled={disabled}
      title="Click for details · Shift+Click to use"
    >
      🧪 Anatomy ×{remaining}
    </button>
  );
}
