import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCorrectness } from '../../../contexts/CorrectnessContext';

export default function Revelation({
  perkKey = 'Revelation',
  targetWord,
  usedPerks,
  markAsUsed,
  remaining
}) {
  const { perks, usePerk } = usePerks();
  const { revealedIndices, revealIndex, getUnrevealedTrulyCorrectIndices } = useCorrectness();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);

  const handleClick = () => {
    if (used || quantity <= 0) return;

    const unrevealed = getUnrevealedTrulyCorrectIndices(targetWord);
    console.log(unrevealed)
    
    if (unrevealed.length === 0) return;

    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    revealIndex(randomIndex);

    markAsUsed(perkKey);
    usePerk(perkKey);
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      🔮 Revelation ×{remaining}
    </button>
  );
}
