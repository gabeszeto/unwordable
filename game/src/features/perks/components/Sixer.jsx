import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';

export default function Sixer({
  perkKey = 'Sixer',
  usedPerks,
  markAsUsed,
  remaining,
  setSixerMode
}) {
  const { perks, usePerk } = usePerks();
  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);

  const handleClick = () => {
    if (used || quantity <= 0) return;
    setSixerMode(true) // Turn on Sixer UI display
    markAsUsed(perkKey);
    usePerk(perkKey)
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      6️⃣ Sixer ×{remaining}
    </button>
  );
}