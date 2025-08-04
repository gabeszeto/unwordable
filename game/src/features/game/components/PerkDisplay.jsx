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
        <div className="perksDisplay">
            <div className="perkSection">
                <div className="topPerksSection">
                    <h3>Inventory</h3>
                    <div className="gold-counter">💰 {gold}</div>
                </div>
                <div className="perkGrid">
                    {Object.entries(perks).map(([key, quantity]) => {
                        const { component: PerkComponent } = perkRegistry[key] || {};
                        if (!PerkComponent) return null;

                        const timesUsed = usedPerks.filter(p => p === key).length;
                        // console.log(`[DEBUG] Perk: ${key}, quantity: ${quantity}, timesUsed: ${timesUsed}`);

                        const remaining = quantity - timesUsed;

                        // console.log(`remaining is ${remaining}`)

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
            {/* this part doodoo fix it */}
            <div className="perkSection">
                <h3>Used Perks</h3>
                <div className="perkGrid">
                    {usedPerks.map((key, index) => {
                        const { component: PerkComponent } = perkRegistry[key] || {};
                        if (!PerkComponent) return null;

                        return (
                            <PerkComponent
                                key={`used-${key}-${index}`}
                                perkKey={key}
                                usedPerks={usedPerks}
                                markAsUsed={markAsUsed}
                                remaining={1}
                                isKeyzoneUsed={key.toLowerCase().includes('keyzone') && usedPerks.some(k => k.toLowerCase().includes('keyzone'))}
                                {...sharedProps}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
