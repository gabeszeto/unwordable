// Revelation.jsx
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
  const {
    revealIndexForRow,
    getUnrevealedTrulyCorrectIndices,
    getRevealedForRow,
  } = useCorrectness();
  const { getRowActiveIndices } = useBoardHelper();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);

  const handleClick = () => {
    if (used || quantity <= 0) return;

    const rowIndex = guesses.length;               // current row
    const allowed = getRowActiveIndices(rowIndex); // debuff-window

    if (!allowed?.length) return;

    // candidates = not-truly-correct & not-already-revealed-for-this-row & inside allowed
    const notTrulyCorrect = getUnrevealedTrulyCorrectIndices();
    const alreadyRevealed = new Set(getRevealedForRow(rowIndex));

    const candidates = allowed.filter(i =>
      notTrulyCorrect.includes(i) && !alreadyRevealed.has(i)
    );

    // fallback: any allowed slot not already revealed this row
    const fallbackUnrevealed = allowed.filter(i => !alreadyRevealed.has(i));

    const pool = candidates.length ? candidates
               : fallbackUnrevealed.length ? fallbackUnrevealed
               : allowed;

    const pick = pool[Math.floor(Math.random() * pool.length)];

    revealIndexForRow(rowIndex, pick); // <-- row-scoped reveal
    markAsUsed(perkKey);
    usePerk(perkKey);
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={used || quantity <= 0}>
      🔮 Revelation ×{remaining}
    </button>
  );
}
