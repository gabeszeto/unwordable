import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';
import useShiftHeld from '../useShiftHeld';

export default function BorrowedTime({
  perkKey = 'BorrowedTime',
  usedPerks,
  markAsUsed,
  remaining,

  // from sharedProps (you already pass these)
  guesses,
  maxGuesses,
  setMaxGuesses,
  bankGuessToNextRound,

  setItemDescriptionKey
}) {
  const { perks, usePerk } = usePerks();
  const shiftHeld = useShiftHeld();
  const qty = perks[perkKey] || 0;
  const alreadyUsed = usedPerks.includes(perkKey);

  // Safety rails
  const MIN_THIS_ROUND = 2;
  const guessesLeft = maxGuesses - guesses.length;

  // Can’t use if:
  // - you’d drop below 2 guesses this round
  // - or you only have 1 guess left right now (would soft-lock)
  const cannotSpare = maxGuesses <= MIN_THIS_ROUND || guessesLeft <= 1;

  const disabled = alreadyUsed || qty <= 0 || cannotSpare;

  const activate = () => {
    if (disabled) return;

    // -1 this round (clamped)
    setMaxGuesses(prev => Math.max(MIN_THIS_ROUND, prev - 1));

    // +1 next round (GameScreen applies cap on round start)
    bankGuessToNextRound();

    // consume
    markAsUsed(perkKey);
    usePerk(perkKey);
  };

  const handleClick = (e) => {
    if (disabled) return;
    if (e.shiftKey) {
      // Shift+Click -> use it
      activate();
    } else {
      // Click -> show info
      setItemDescriptionKey?.(perkKey);
    }
  };

  return (
    <button
      className={`perk-button ${shiftHeld ? 'perk-shift-held' : ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      ⌛️ Borrowed Time ×{remaining}
    </button>
  );
}
