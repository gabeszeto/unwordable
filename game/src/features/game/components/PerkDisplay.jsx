import { perkRegistry } from '../../perks/perkRegistry.js';

export default function PerkDisplay({
    perks,
    usedPerks,
    markAsUsed,
    usePerk,
    sharedProps
}) {
    return (
        <div className="perksDisplay">
            <div className="perkSection">
                <h3>Inventory</h3>
                <div className="perkGrid">
                    {Object.entries(perks).map(([key, quantity]) => {
                        const { component: PerkComponent } = perkRegistry[key] || {};
                        if (!PerkComponent) return null;

                        const timesUsed = usedPerks.filter(p => p === key).length;
                        const remaining = quantity - timesUsed;
                        if (remaining < 0) return null;

                        return (
                            <PerkComponent
                                key={`inv-${key}`}
                                perkKey={key}
                                usedPerks={usedPerks}
                                markAsUsed={markAsUsed}
                                onUse={() => {
                                    usePerk(key);
                                    markAsUsed(key);
                                }}
                                {...sharedProps}
                            />
                        );
                    })}
                </div>
            </div>

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
                                onUse={() => { }}
                                {...sharedProps}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
