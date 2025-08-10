// Revelation.jsx
import '../perks.css';
import useShiftHeld from '../useShiftHeld';
import { usePerks } from "../../../contexts/perks/PerksContext";
import { useCorrectness } from "../../../contexts/CorrectnessContext";
import { useBoardHelper } from "../../../contexts/BoardHelperContext";

export default function Revelation({
  perkKey = 'Revelation',
  usedPerks,
  markAsUsed,
  remaining,
  guesses,
  setItemDescriptionKey, // 👈 add this
}) {
  const shiftHeld = useShiftHeld();
  const { perks, usePerk } = usePerks();
  const {
    revealIndexForRow,
    getUnrevealedTrulyCorrectIndices,
    getRevealedForRow,
  } = useCorrectness();
  const { getRowActiveIndices } = useBoardHelper();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);
  const disabled = used || quantity <= 0;

  const activate = () => {
    if (disabled) return;

    const rowIndex = guesses.length;                // current row
    const allowed = getRowActiveIndices(rowIndex);  // debuff-window
    if (!allowed?.length) return;

    // candidates = not-truly-correct & not-already-revealed-for-this-row & inside allowed
    const notTrulyCorrect = getUnrevealedTrulyCorrectIndices();
    const alreadyRevealed = new Set(getRevealedForRow(rowIndex));

    const candidates = allowed.filter(i =>
      notTrulyCorrect.includes(i) && !alreadyRevealed.has(i)
    );

    // fallback: any allowed slot not already revealed this row; else any allowed
    const fallbackUnrevealed = allowed.filter(i => !alreadyRevealed.has(i));
    const pool = candidates.length ? candidates
               : fallbackUnrevealed.length ? fallbackUnrevealed
               : allowed;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    revealIndexForRow(rowIndex, pick); // row-scoped reveal

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
      🔮 Revelation ×{remaining}
    </button>
  );
}
