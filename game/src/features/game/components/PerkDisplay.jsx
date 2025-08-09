import React, { useMemo } from 'react';

import { perkRegistry } from '../../perks/perkRegistry.js';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCash } from '../../../contexts/cash/CashContext.jsx';
import { useLevel } from '../../../contexts/level/LevelContext';
import { useDebuffs } from '../../../contexts/debuffs/DebuffsContext';

import './perksDisplayStyles.css'

export default function PerkDisplay({
  usedPerks,
  markAsUsed,
  sharedProps,
}) {
  const { perks } = usePerks();
  const { cash, spendCash } = useCash();              // ⬅️ move out of map
  const { stage } = useLevel();
  const { passiveDebuffs } = useDebuffs();            // ⬅️ move out of map

  // Snapshot at start of round; stable until stage changes
  const perksAtStartOfRound = useMemo(() => ({ ...perks }), [stage]);

  const perkTaxStacks = passiveDebuffs['PerkTax'] || 0;
  const applyPerkTax = () => {
    if (perkTaxStacks > 0) spendCash(perkTaxStacks);
  };

  return (
    <div className="perkDisplay">
      <div className="topPerksSection">
        <div className="inventoryTitle">Consumables</div>
        <div className="cash-counter">💰 {cash}</div>
      </div>

      <div className="perkGrid">
        {Object.entries(perksAtStartOfRound).map(([key, startingQuantity]) => {
          const { component: PerkComponent } = perkRegistry[key] || {};
          if (!PerkComponent) return null;

          const timesUsed = usedPerks.filter(p => p === key).length;

          // Only show if it existed at round start OR has been used this round
          if (startingQuantity <= 0 && timesUsed <= 0) return null;

          // ✅ Remaining is based on the start-of-round snapshot minus how many times you used it this round
          const remaining = Math.max(0, (startingQuantity || 0) - timesUsed);

          return (
            <PerkComponent
              key={`inv-${key}`}
              perkKey={key}
              usedPerks={usedPerks}
              markAsUsed={(k) => {
                markAsUsed(k);
                applyPerkTax(); // 💸 Apply cash tax on use
              }}
              remaining={remaining}
              isKeyzoneUsed={
                key.toLowerCase().includes('keyzone') &&
                usedPerks.some(k => k.toLowerCase().includes('keyzone'))
              }
              {...sharedProps}
            />
          );
        })}
      </div>
    </div>
  );
}
