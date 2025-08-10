// Wager.jsx
import React from 'react';
import '../perks.css';
import useShiftHeld from '../useShiftHeld';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCash } from '../../../contexts/cash/CashContext';

export default function Wager({
  perkKey = 'Wager',
  usedPerks,
  markAsUsed,
  remaining,
  setItemDescriptionKey // 👈 added
}) {
  const { perks, usePerk } = usePerks();
  const { cash, placeWager, pendingWager } = useCash();
  const shiftHeld = useShiftHeld();

  const used = usedPerks.includes(perkKey);
  const quantity = perks[perkKey] || 0;

  const cost = 5;
  const canAfford = cash >= cost;
  const disabled =
    used || quantity <= 0 || !canAfford || !!pendingWager; // prevent stacking

  const activate = () => {
    if (disabled) return;
    const ok = placeWager({ stake: cost, payout: cost });
    if (!ok) return;
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
      💸 Wager ×{remaining}
    </button>
  );
}
