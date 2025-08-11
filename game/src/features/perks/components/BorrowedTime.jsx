// src/features/perks/components/BorrowedTime.jsx
import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { usePerkActions } from '../usePerkActions';
import useShiftHeld from '../useShiftHeld';

export default function BorrowedTime({
  perkKey = 'BorrowedTime',
  usedPerks,
  remaining,

  // runtime from sharedProps
  guesses,
  maxGuesses,
  setMaxGuesses,
  bankGuessToNextRound,

  // UI + accounting helpers from sharedProps
  markAsUsed,
  setItemDescriptionKey,
}) {
  const { perks } = usePerks();
  const { runPerk } = usePerkActions();
  const shiftHeld = useShiftHeld();

  const qty = perks[perkKey] || 0;
  const alreadyUsed = usedPerks.includes(perkKey);

  // Same guard as before (for button disabled state)
  const MIN_THIS_ROUND = 2;
  const guessesLeft = (maxGuesses ?? 0) - (guesses?.length ?? 0);
  const cannotSpare = (maxGuesses ?? 0) <= MIN_THIS_ROUND || guessesLeft <= 1;

  const disabled = alreadyUsed || qty <= 0 || cannotSpare;

  const handleClick = (e) => {
    if (disabled) return;

    if (e.shiftKey) {
      // Use via centralized action
      const res = runPerk(perkKey, {
        // the runtime bag
        guesses,
        maxGuesses,
        setMaxGuesses,
        bankGuessToNextRound,

        // UI/accounting side-effects
        markAsUsed,
      });

      if (!res.ok) {
        // optional: show toast or console.warn
        console.warn(res.error);
      }
    } else {
      // Click → open description
      setItemDescriptionKey?.(perkKey);
    }
  };

  return (
    <button
      className={`perk-button ${shiftHeld && !disabled ? 'perk-shift-held' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title={
        cannotSpare ? "You can't spare a guess this round" : 'Click: details • Shift+Click: use'
      }
    >
      ⌛️ Borrowed Time ×{remaining}
    </button>
  );
}
