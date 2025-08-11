// Wager.jsx
import React from 'react';
import '../perks.css';
import useShiftHeld from '../useShiftHeld';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCash } from '../../../contexts/cash/CashContext';
import { usePerkActions } from '../usePerkActions';

export default function Wager({
  perkKey = 'Wager',
  usedPerks,
  markAsUsed,
  remaining,
  setItemDescriptionKey,
}) {
  const { perks } = usePerks();
  const { cash, pendingWager } = useCash(); // for pre-disable UX only
  const { runPerk } = usePerkActions();
  const shiftHeld = useShiftHeld();

  const quantity = perks[perkKey] || 0;
  const used = usedPerks.includes(perkKey);

  // Optional UX: pre-disable if not affordable or a wager is already active.
  const cost = 5;
  const canAfford = cash >= cost;
  const disabled = used || quantity <= 0 || !canAfford || !!pendingWager;

  const handleClick = (e) => {
    if (disabled) return;

    if (e.shiftKey) {
      const res = runPerk(perkKey, {
        markAsUsed, // so PerkDisplay “remaining” updates
      });
      if (!res.ok) {
        // Optional: toast/console to see why it failed
        console.warn(res.error);
      }
    } else {
      setItemDescriptionKey?.(perkKey); // open the item description panel
    }
  };

  return (
    <button
      className={`perk-button ${shiftHeld ? 'perk-shift-held' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title="Click for details · Shift+Click to use"
    >
      💸 Wager ×{remaining}
    </button>
  );
}
