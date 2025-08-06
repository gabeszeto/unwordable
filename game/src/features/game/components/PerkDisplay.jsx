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
    const { cash } = useCash();
    const { stage } = useLevel();
    const perksAtStartOfRound = useMemo(() => ({ ...perks }), [stage]);

    return (
        <div className="perkDisplay">
            <div className="topPerksSection">
                <div className="inventoryTitle">Inventory</div>
                <div className="cash-counter">💰 {cash}</div>
            </div>
            <div className="perkGrid">
                {Object.entries(perksAtStartOfRound).map(([key, startingQuantity]) => {
                    const { component: PerkComponent } = perkRegistry[key] || {};
                    if (!PerkComponent) return null;

                    const { passiveDebuffs } = useDebuffs();
                    const perkTaxStacks = passiveDebuffs['PerkTax'] || 0;
                    const { spendCash } = useCash();
                    
                    const applyPerkTax = () => {
                        if (perkTaxStacks > 0) {
                          spendCash(perkTaxStacks);
                        }
                      };

                    const currentQty = perks[key] || 0;
                    const timesUsed = usedPerks.filter(p => p === key).length;
                    const remaining = currentQty - timesUsed;

                    // Show only if it was available at start
                    // Even if remaining is 0 but it was used, we show it
                    if (startingQuantity <= 0 && timesUsed <= 0) return null;

                    return (
                        <PerkComponent
                          key={`inv-${key}`}
                          perkKey={key}
                          usedPerks={usedPerks}
                          markAsUsed={(k) => {
                            markAsUsed(k);
                            applyPerkTax(); // 💸 Apply gold tax
                          }}
                          remaining={Math.max(0, remaining)}
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
