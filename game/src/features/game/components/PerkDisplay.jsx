import React, { useMemo } from 'react';

import { perkRegistry } from '../../perks/perkRegistry.js';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useCash } from '../../../contexts/cash/CashContext.jsx';
import { useLevel } from '../../../contexts/level/LevelContext';

import './perksDisplayStyles.css'

export default function PerkDisplay({
  usedPerks,
  markAsUsed,
  sharedProps,
}) {
  const { perks } = usePerks();
  const { cash } = useCash();              // ⬅️ move out of map
  const { stage } = useLevel();

  // Snapshot at start of round; stable until stage changes
  const perksAtStartOfRound = useMemo(() => ({ ...perks }), [stage]);


  return (
    <div className="perkDisplay">
      <div className="topPerksSection">
        <div className="inventoryTitle">Consumables</div>
        <div className="cash-counter">💰 {cash}</div>
      </div>

      <div className="perkGrid">
        {(!Object.keys(perksAtStartOfRound).length ||
          Object.values(perksAtStartOfRound).every(v => v === 0)) ? (
          <div className="perk-empty">None yet</div>
        ) : (
          Object.entries(perksAtStartOfRound).map(([key, startingQuantity]) => {
            const { component: PerkComponent } = perkRegistry[key] || {};
            if (!PerkComponent) return null;

            const timesUsed = usedPerks.filter(p => p === key).length;

            if (startingQuantity <= 0 && timesUsed <= 0) return null;

            const remaining = Math.max(0, (startingQuantity || 0) - timesUsed);

            return (
              <PerkComponent
                key={`inv-${key}`}
                perkKey={key}
                usedPerks={usedPerks}
                markAsUsed={markAsUsed}
                remaining={remaining}
                isKeyzoneUsed={
                  key.toLowerCase().includes('keyzone') &&
                  usedPerks.some(k => k.toLowerCase().includes('keyzone'))
                }
                {...sharedProps}
              />
            );
          })
        )}
      </div>

    </div>
  );
}
