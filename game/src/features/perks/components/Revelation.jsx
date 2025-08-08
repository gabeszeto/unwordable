import { usePerks } from "../../../contexts/perks/PerksContext";
import { useCorrectness } from "../../../contexts/CorrectnessContext";
import { useBoardHelper } from "../../../contexts/BoardHelperContext";

export default function Revelation({
  perkKey = 'Revelation',
  usedPerks,
  markAsUsed,
  remaining,
  guesses
}) {
  const { perks, usePerk } = usePerks();
  const { revealIndex, getUnrevealedTrulyCorrectIndices, revealedIndices } = useCorrectness();
  const { getRowActiveIndices } = useBoardHelper();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);

  const currentRow = Array.isArray(guesses) ? guesses.length : 0;
  const allowed = getRowActiveIndices(currentRow) || [];

  const handleClick = () => {
    if (used || quantity <= 0) return;
  
    const allowed = getRowActiveIndices(guesses.length) || [];
    if (!allowed.length) return; // no playable slots in this row
  
    // 1) Intersection: (unrevealed & not-truly-correct from [1..5]) ∩ allowed
    const unrevealedTruly = getUnrevealedTrulyCorrectIndices(); // from context, in [1..5]
    const allowedSet = new Set(allowed);
    const candidates = unrevealedTruly.filter(i => allowedSet.has(i));
  
    // 2) Fallback: any unrevealed index within the allowed window
    const fallbackUnrevealed = allowed.filter(i => !revealedIndices.includes(i));
  
    // 3) Last resort: any allowed index
    const pool =
      candidates.length ? candidates :
      fallbackUnrevealed.length ? fallbackUnrevealed :
      allowed;
  
    const pick = pool[Math.floor(Math.random() * pool.length)];
    revealIndex(pick);
  
    markAsUsed(perkKey);
    usePerk(perkKey);
  };
  

  const disabled = used || quantity <= 0 || !allowed.length;

  return (
    <button className="perk-button" onClick={handleClick} disabled={disabled}>
      🔮 Revelation ×{remaining}
    </button>
  );
}
