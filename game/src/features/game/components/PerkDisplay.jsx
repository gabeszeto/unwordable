import { perkRegistry } from '../../perks/perkRegistry.js';
import { usePerks } from '../../../contexts/perks/PerksContext';
import { useGold } from '../../../contexts/gold/GoldContext.jsx';

import './perksDisplayStyles.css'

export default function PerkDisplay({
    usedPerks,
    markAsUsed,
    sharedProps,
}) {
    const { perks } = usePerks();
    const { gold } = useGold();


    return (
        <div className="perkDisplay">
            <div className="topPerksSection">
                <div className="inventoryTitle">Inventory</div>
                <div className="gold-counter">💰 {gold}</div>
            </div>
            <div className="perkGrid">
                {Object.entries(perks).map(([key, quantity]) => {
                    const { component: PerkComponent } = perkRegistry[key] || {};
                    if (!PerkComponent) return null;

                    const timesUsed = usedPerks.filter(p => p === key).length;

                    const remaining = quantity - timesUsed;

                    if (remaining <= 0) return null;

                    return (
                        <PerkComponent
                            key={`inv-${key}`}
                            perkKey={key}
                            usedPerks={usedPerks}
                            markAsUsed={markAsUsed}
                            remaining={remaining}
                            isKeyzoneUsed={key.toLowerCase().includes('keyzone') && usedPerks.some(k => k.toLowerCase().includes('keyzone'))}
                            {...sharedProps}
                        />
                    );
                })}
            </div>
        </div>
    );
}
