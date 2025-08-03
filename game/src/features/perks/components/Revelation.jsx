import { usePerks } from '../../../contexts/perks/PerksContext';

export default function Revelation({
  perkKey = 'Revelation',
  targetWord,
  revealedIndices,
  setRevealedIndices,
  used,
  setUsed,
  onUse,
}) {
  const { perks } = usePerks();
  const quantity = perks[perkKey] || 0;

  const handleClick = () => {
    if (used || quantity <= 0) return;

    const unrevealed = [...targetWord]
      .map((_, i) => (revealedIndices.includes(i) ? null : i))
      .filter(i => i !== null);

    if (unrevealed.length === 0) return;

    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    setRevealedIndices([...revealedIndices, randomIndex]);
    setUsed(true);
    onUse(); // decrements count
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      🔮 Revelation ×{quantity}
    </button>
  );
}
