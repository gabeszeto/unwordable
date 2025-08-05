import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function Anatomy({
  perkKey = 'Anatomy',
  usedPerks,
  markAsUsed,
  remaining,
  setInfoPerkKey
}) {
  const { perks, usePerk } = usePerks();
  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);

  const handleClick = () => {
    if (used || quantity <= 0) return;
    setInfoPerkKey?.(perkKey); 
    markAsUsed(perkKey);
    usePerk(perkKey)
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      🧪 Anatomy ×{remaining}
    </button>
  );
}
