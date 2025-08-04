import React, { useMemo } from 'react';

import { perkRegistry } from '../../perks/perkRegistry.js';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useGold } from '../../../contexts/gold/GoldContext.jsx';
import { useLevel } from '../../../contexts/level/LevelContext';

import './perksDisplayStyles.css'

export default function PerkDisplay({
    usedPerks,
    markAsUsed,
    sharedProps,
}) {
    const { perks } = usePerks();
    const { gold } = useGold();
    const { stage } = useLevel();
    const perksAtStartOfRound = useMemo(() => ({ ...perks }), [stage]);

    return (
        <div className="perkDisplay">
            <div className="topPerksSection">
                <div className="inventoryTitle">Inventory</div>
                <div className="gold-counter">💰 {gold}</div>
            </div>
            <div className="perkGrid">
                {Object.entries(perksAtStartOfRound).map(([key, startingQuantity]) => {
                    const { component: PerkComponent } = perkRegistry[key] || {};
                    if (!PerkComponent) return null;

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
                            markAsUsed={markAsUsed}
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
