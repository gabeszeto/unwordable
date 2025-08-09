// Wager.jsx
import React from 'react';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCash } from '../../../contexts/cash/CashContext';

export default function Wager({
  perkKey = 'Wager',
  usedPerks,
  markAsUsed,
  remaining,
}) {
  const { perks, usePerk } = usePerks();
  const { cash, placeWager, pendingWager } = useCash();

  const used = usedPerks.includes(perkKey);
  const quantity = perks[perkKey] || 0;

  const cost = 5;
  const canAfford = cash >= cost;
  const disabled =
    used || quantity <= 0 || !canAfford || !!pendingWager; // prevent stacking

  const handleClick = () => {
    if (disabled) return;

    const ok = placeWager({ stake: 5, payout: 5 });
    if (!ok) return;

    // Mark perk usage (UI) and decrement inventory
    markAsUsed(perkKey);
    usePerk(perkKey);
  };

  return (
    <button className="perk-button" onClick={handleClick} disabled={disabled} title="Bet 5 Cash on your next guess. Win 10 if correct; lose the stake if wrong.">
      💸 Wager ×{remaining}
    </button>
  );
}
