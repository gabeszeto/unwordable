import '../perks.css';
import { usePerks } from '../../../contexts/perks/PerksContext';
import useShiftHeld from '../useShiftHeld';

function pickDeadLetters(targetWord, usedKeys, count = 2) {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const targetSet = new Set(String(targetWord || '').toUpperCase().split(''));

  // Eligible = not already colored + not in targetWord
  const eligible = ALPHABET.filter(ch => !usedKeys?.[ch] && !targetSet.has(ch));

  // Shuffle (Fisher–Yates lite) and take up to `count`
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  return eligible.slice(0, count);
}

export default function DeadKeys({
  perkKey = 'DeadKeys',
  usedPerks,
  markAsUsed,
  remaining,

  // from sharedProps
  targetWord,
  usedKeys,
  setUsedKeys,
  setItemDescriptionKey
}) {
  const { perks, usePerk } = usePerks();
  const shiftHeld = useShiftHeld();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);
  const disabled = used || quantity <= 0;

  const activate = () => {
    if (disabled) return;

    // choose 2 letters to gray out
    const picks = pickDeadLetters(targetWord, usedKeys, 2);
    if (picks.length === 0) return;

    // mark them as absent in keyboard state
    setUsedKeys(prev => {
      const next = { ...prev };
      for (const ch of picks) next[ch] = 'absent';
      return next;
    });

    // consume the perk
    markAsUsed(perkKey);
    usePerk(perkKey);
  };

  const handleClick = (e) => {
    if (disabled) return;
    if (e.shiftKey) {
      // Shift+Click -> use perk
      activate();
    } else {
      // Normal click -> show info
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
      ⬜️ Dead Keys ×{remaining}
    </button>
  );
}
